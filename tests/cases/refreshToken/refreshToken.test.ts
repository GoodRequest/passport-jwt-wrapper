import express, { Express, Request } from 'express'
import passport from 'passport'
import i18next, { InitOptions as I18nextOptions, t } from 'i18next'
import i18nextMiddleware from 'i18next-http-middleware'
import i18nextBackend from 'i18next-fs-backend'
import request, { Response } from 'supertest'
import { expect } from 'chai'
import config from 'config'

import { ApiAuth, initAuth, IPassportConfig, JWT_AUDIENCE, RefreshToken } from '../../../src'

import { UserRepository } from '../../mocks/repositories/userRepository'
import { loginUsers } from '../../seeds/users'
import { TokenRepository } from '../../mocks/repositories/tokenRepository'
import errorMiddleware from '../../mocks/middlewares/errorMiddleware'
import { getUser, languages, loginUserAndSetTokens, seedUserAndSetID, testEndpoint } from '../../helpers'
import LoginRouter from '../../mocks/loginRouter'
import schemaMiddleware from '../../mocks/middlewares/schemaMiddleware'
import { createJwt, decodeRefreshJwt } from '../../../src/utils/jwt'

import * as enErrors from '../../../locales/en/error.json'
import * as skErrors from '../../../locales/sk/error.json'
import TestingEndpoint from '../../mocks/testingEndpoint'

const i18NextConfig: I18nextOptions = config.get('i18next')
const passportConfig: IPassportConfig = config.get('passport')

let app: Express
let userRepo: UserRepository

function sleep(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

/**
 * returns error string based on language
 * en is default
 * @param language
 */
function invalidRefreshTokenErrorString(language?: string): string {
	if (language && language === 'sk') {
		return skErrors['Refresh token is not valid']
	}

	return enErrors['Refresh token is not valid']
}

before(async () => {
	userRepo = new UserRepository()

	const promises: Promise<void>[] = []
	// seed users
	loginUsers.getAllPositiveValues().forEach((u) => {
		promises.push(seedUserAndSetID(userRepo, u))
	})

	await Promise.all(promises)

	// init authentication library
	initAuth(passport, {
		userRepository: userRepo,
		refreshTokenRepository: TokenRepository.getInstance()
	})
})

/**
 * Helper function for setting up express routers for testing
 */
function setupRouters() {
	const loginRouter = LoginRouter()

	loginRouter.post('/refresh-token', schemaMiddleware(RefreshToken.requestSchema), RefreshToken.endpoint)

	app.use('/auth', loginRouter)

	app.get('/endpoint', ApiAuth.guard(), TestingEndpoint)

	app.use(errorMiddleware)
}

/**
 * If no language is set, 'accept-language' is set to 'sk', but 'en' response is expected
 * @param token
 * @param lang
 */
async function runNegativeTest(token: string, lang?: string): Promise<Response> {
	const response = await request(app)
		.post('/auth/refresh-token')
		.set('accept-language', lang ?? 'sk')
		.send({
			refreshToken: token
		})

	expect(response.statusCode).to.eq(401)
	// eslint-disable-next-line @typescript-eslint/no-unused-expressions
	expect(response.body.messages).to.exist
	expect(response.body.messages[0].message).to.eq(invalidRefreshTokenErrorString(lang))

	return response
}

function declareNegativeTests(lang?: string) {
	it(`${lang ? `[${lang}] ` : ''}Expired refresh token`, async () => {
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
		await runNegativeTest(token, lang)
	})

	it(`${lang ? `[${lang}] ` : ''}Forged refresh token`, async () => {
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

		await runNegativeTest(token, lang)
	})

	it(`${lang ? `[${lang}] ` : ''}Refresh invalidated token`, async () => {
		const user = getUser()
		await loginUserAndSetTokens(app, user)
		const tokenRepo = TokenRepository.getInstance()

		const { rt } = user
		const payload = await decodeRefreshJwt(rt, { t } as Request)

		await tokenRepo.invalidateRefreshToken(`${payload.uid}`, `${payload.jti}`, `${payload.fid}`)

		await runNegativeTest(rt, lang)
	})

	it(`${lang ? `[${lang}] ` : ''}Refresh invalidated family token`, async () => {
		const tokenRepo = TokenRepository.getInstance()
		const user = getUser()

		await loginUserAndSetTokens(app, user)

		const { rt: rt1 } = user

		// login user again to simulate other session
		await loginUserAndSetTokens(app, user)

		const { rt: rt2 } = user

		// invalidate rt1
		const payload = await decodeRefreshJwt(rt1, { t } as Request)

		await tokenRepo.invalidateRefreshTokenFamily(`${payload.uid}`, `${payload.fid}`)

		await runNegativeTest(rt1, lang)

		// rt2 should still work
		const response2 = await request(app).post('/auth/refresh-token').send({
			refreshToken: rt2
		})

		expect(response2.statusCode).to.eq(200)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(response2.body.accessToken).to.exist
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(response2.body.refreshToken).to.exist
	})

	it(`${lang ? `[${lang}] ` : ''}Refresh already refreshed token`, async () => {
		const user = getUser()

		await loginUserAndSetTokens(app, user)

		const { rt: rt1 } = user

		const response = await request(app).post('/auth/refresh-token').send({
			refreshToken: rt1
		})

		expect(response.statusCode).to.eq(200)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(response.body.accessToken).to.exist
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(response.body.refreshToken).to.exist

		const { refreshToken: rt2 } = response.body

		await runNegativeTest(rt1, lang)
		await runNegativeTest(rt2, lang)
	})

	it(`${lang ? `[${lang}] ` : ''}Removed user`, async () => {
		const user = getUser()
		await loginUserAndSetTokens(app, user)

		const { rt } = user

		await userRepo.delete(user.id)

		await runNegativeTest(rt, lang)

		// clean up
		await seedUserAndSetID(userRepo, user)
	})
}

describe('Refresh Token endpoint without i18next', () => {
	before(async () => {
		// init express app
		app = express()

		app.use(express.urlencoded({ extended: true }))
		app.use(express.json())

		setupRouters()
	})

	// no lang -> 'sk' is requested, 'en' is expected in response
	declareNegativeTests()
})

describe('Refresh Token endpoint with i18next', () => {
	before(async () => {
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

		setupRouters()
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

	languages.forEach((lang) => {
		declareNegativeTests(lang)
	})

	it('Refresh token', async () => {
		const user = getUser()
		await loginUserAndSetTokens(app, user)

		const response = await request(app).post('/auth/refresh-token').send({
			refreshToken: user.rt
		})

		expect(response.statusCode).to.eq(200)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(response.body.accessToken).to.exist
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(response.body.refreshToken).to.exist

		const { accessToken } = response.body

		await testEndpoint(app, accessToken)
	})

	it('Refresh already refreshed token', async () => {
		const user = getUser()
		await loginUserAndSetTokens(app, user)
		const response = await request(app).post('/auth/refresh-token').send({
			refreshToken: user.rt
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

		await testEndpoint(app, accessToken)
	})
})
