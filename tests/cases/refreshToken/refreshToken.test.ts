import express, { Express } from 'express'
import passport from 'passport'
import i18next, { InitOptions as I18nextOptions, t } from 'i18next'
import i18nextMiddleware from 'i18next-http-middleware'
import i18nextBackend from 'i18next-fs-backend'
import request from 'supertest'
import { expect } from 'chai'
import config from 'config'

import { ApiAuth, initAuth, IPassportConfig, JWT_AUDIENCE, RefreshToken } from '../../../src'

import { UserRepository } from '../../mocks/userRepository'
import { LoginUser, loginUsers } from '../../seeds/users'
import { TokenRepository } from '../../mocks/tokenRepository'
import errorMiddleware from '../../mocks/errorMiddleware'
import { loginUserAndSetTokens } from '../../helpers'
import LoginRouter from '../../mocks/loginRouter'
import schemaMiddleware from '../../mocks/schemaMiddleware'
import { createJwt, decodeRefreshJwt } from '../../../src/utils/jwt'

const i18NextConfig: I18nextOptions = config.get('i18next')
const passportConfig: IPassportConfig = config.get('passport')

let app: Express

function sleep(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

async function testEndpoint(accessToken: string) {
	const response = await request(app).get('/endpoint').set('Authorization', `Bearer ${accessToken}`)

	expect(response.statusCode).to.eq(200)
}

async function seedUserAndSetID(user: LoginUser, userRepo: UserRepository): Promise<void> {
	const repoUser = await userRepo.add(user.email, user.password)
	user.setID(repoUser.id)
}

function getUser(): LoginUser {
	const user = loginUsers.getPositiveValue()
	if (!user) {
		throw new Error('No positive user')
	}

	return user
}

describe('Refresh Token endpoint', () => {
	before(async () => {
		const userRepo = new UserRepository()

		const promises: Promise<void>[] = []
		// seed users
		loginUsers.getAllPositiveValues().forEach((u) => {
			promises.push(seedUserAndSetID(u, userRepo))
		})

		await Promise.all(promises)

		// init authentication library
		initAuth(passport, {
			userRepository: userRepo,
			refreshTokenRepository: TokenRepository.getInstance()
		})
		// init express app
		app = express()

		app.use(express.urlencoded({ extended: true }))
		app.use(express.json())

		// i18next config
		await i18next
			.use(i18nextMiddleware.LanguageDetector)
			.use(i18nextBackend)
			.init(JSON.parse(JSON.stringify(i18NextConfig))) // it has to be deep copied

		app.use(i18nextMiddleware.handle(i18next))

		const loginRouter = LoginRouter()

		loginRouter.post('/refresh-token', schemaMiddleware(RefreshToken.requestSchema), RefreshToken.endpoint)

		app.use('/auth', loginRouter)

		app.get('/endpoint', ApiAuth.guard(), (req, res) => {
			return res.sendStatus(200)
		})

		app.use(errorMiddleware)
	})

	it('Refresh token null', async () => {
		const response = await request(app).post('/auth/refresh-token').send({
			refreshToken: null
		})

		expect(response.statusCode).to.eq(400)
	})

	it('No refresh token', async () => {
		const response = await request(app).post('/auth/refresh-token')

		expect(response.statusCode).to.eq(400)
	})

	it('Testing mocked refresh token', async () => {
		const user = getUser()
		await loginUserAndSetTokens(app, user)

		const { refreshToken } = user
		if (!refreshToken) {
			throw new Error('No refresh token')
		}

		const payload = await decodeRefreshJwt(refreshToken, t)
		const token = await createJwt(
			{
				uid: user.id,
				fid: payload.fid
			},
			{
				audience: JWT_AUDIENCE.API_REFRESH,
				expiresIn: passportConfig.jwt.api.refresh.exp,
				jwtid: `${payload.jti}`
			}
		)

		const response = await request(app).post('/auth/refresh-token').send({
			refreshToken: token
		})

		expect(response.statusCode).to.eq(200)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(response.body.accessToken).to.exist
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(response.body.refreshToken).to.exist
	})

	it('Expired refresh token', async () => {
		const user = getUser()
		const token = await createJwt(
			{
				uid: user.id,
				fid: 'a'
			},
			{
				audience: JWT_AUDIENCE.API_REFRESH,
				expiresIn: '1s',
				jwtid: `a`
			}
		)

		await sleep(100)
		const response = await request(app).post('/auth/refresh-token').send({
			refreshToken: token
		})

		expect(response.statusCode).to.eq(401)
	})

	it('Forged refresh token', async () => {
		const user = getUser()
		const token = await createJwt(
			{
				uid: user.id,
				fid: 'a'
			},
			{
				audience: JWT_AUDIENCE.API_REFRESH,
				expiresIn: passportConfig.jwt.api.refresh.exp,
				jwtid: `a`
			},
			'aaaaaaaaaaaaaaaaaaaaaaaaa'
		)

		const response = await request(app).post('/auth/refresh-token').send({
			refreshToken: token
		})

		expect(response.statusCode).to.eq(401)
	})

	it('Refresh token', async () => {
		const user = getUser()
		await loginUserAndSetTokens(app, user)

		const response = await request(app).post('/auth/refresh-token').send({
			refreshToken: user.refreshToken
		})

		expect(response.statusCode).to.eq(200)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(response.body.accessToken).to.exist
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(response.body.refreshToken).to.exist

		const { accessToken } = response.body

		await testEndpoint(accessToken)
	})

	it('Refresh already refreshed token', async () => {
		const user = getUser()
		await loginUserAndSetTokens(app, user)
		const response = await request(app).post('/auth/refresh-token').send({
			refreshToken: user.refreshToken
		})

		expect(response.statusCode).to.eq(200)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(response.body.accessToken).to.exist
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(response.body.refreshToken).to.exist

		const { refreshToken } = response.body
		const response2 = await request(app).post('/auth/refresh-token').send({
			refreshToken
		})

		expect(response2.statusCode).to.eq(200)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(response2.body.accessToken).to.exist
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(response2.body.refreshToken).to.exist

		const { accessToken } = response.body

		await testEndpoint(accessToken)
	})
	// TODO: test translations
	// TODO: test invalidating refresh tokens
	// TODO: test save token multiple times
})
