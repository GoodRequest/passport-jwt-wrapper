import passport from 'passport'
import express, { Express } from 'express'
import i18next, { InitOptions as I18nextOptions } from 'i18next'
import i18nextMiddleware from 'i18next-http-middleware'
import i18nextBackend from 'i18next-fs-backend'
import config from 'config'
import request, { Response } from 'supertest'

import { expect } from 'chai'
import { ApiAuth, initAuth, JWT_AUDIENCE, Logout, RefreshToken } from '../../../src'

import { UserRepository } from '../../mocks/repositories/userRepository'
import { TokenRepository } from '../../mocks/repositories/tokenRepository'
import LoginRouter from '../../mocks/loginRouter'
import TestingEndpoint from '../../mocks/testingEndpoint'
import errorMiddleware from '../../mocks/middlewares/errorMiddleware'
import schemaMiddleware from '../../mocks/middlewares/schemaMiddleware'
import { getUser, languages, loginUserAndSetTokens, seedUsers } from '../../helpers'

import * as enTranslations from '../../../locales/en/translation.json'
import * as skTranslations from '../../../locales/sk/translation.json'
import { createJwt } from '../../../src/utils/jwt'

const i18NextConfig: I18nextOptions = config.get('passportJwtWrapper.i18next')

function getLogoutMessage(language?: string): string {
	if (language && language === 'sk') {
		return skTranslations['You were successfully logged out']
	}

	return enTranslations['You were successfully logged out']
}

/**
 * Helper function for setting up express routers for testing
 */
function setupRouters(app: Express) {
	const loginRouter = LoginRouter()

	loginRouter.post('/logout', ApiAuth.guard(), schemaMiddleware(Logout.requestSchema), Logout.endpoint)
	loginRouter.post('/refresh-token', schemaMiddleware(RefreshToken.requestSchema), RefreshToken.endpoint)

	app.use('/auth', loginRouter)

	app.get('/endpoint', ApiAuth.guard(), TestingEndpoint)

	app.use(errorMiddleware)
}

async function runNegativeRefreshTokenAttempt(app: Express, refreshToken: string): Promise<Response> {
	const response = await request(app).post('/auth/refresh-token').send({
		refreshToken
	})

	expect(response.statusCode).to.eq(401)

	return response
}

describe('User logout with i18next', () => {
	const app = express()

	before(async () => {
		const userRepo = new UserRepository()

		await seedUsers(userRepo)

		// init authentication library
		initAuth(passport, {
			userRepository: userRepo,
			refreshTokenRepository: TokenRepository.getInstance()
		})

		app.use(express.urlencoded({ extended: true }))
		app.use(express.json())

		// i18next config
		await i18next
			.use(i18nextMiddleware.LanguageDetector)
			.use(i18nextBackend)
			.init(JSON.parse(JSON.stringify(i18NextConfig))) // it has to be deep copied

		app.use(i18nextMiddleware.handle(i18next))

		setupRouters(app)
	})

	languages.forEach((lang) => {
		it(`[${lang}] Successful user logout`, async () => {
			const user = getUser()
			await loginUserAndSetTokens(app, user)

			const response = await request(app).post('/auth/logout').set('accept-language', lang).set('authorization', `Bearer ${user.at}`)

			expect(response.statusCode).to.eq(200)
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(response.body.messages[0].message).to.exist
			expect(response.body.messages[0].message).to.eq(getLogoutMessage(lang))

			await runNegativeRefreshTokenAttempt(app, user.rt)
		})
	})

	it(`Other token is valid after successful user logout`, async () => {
		const user = getUser()
		await loginUserAndSetTokens(app, user)
		const { at, rt: rt1 } = user

		// login again - simulate other parallel session
		await loginUserAndSetTokens(app, user)
		const { rt: rt2 } = user

		const response = await request(app).post('/auth/logout').set('authorization', `Bearer ${at}`)

		expect(response.statusCode).to.eq(200)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(response.body.messages[0].message).to.exist
		expect(response.body.messages[0].message).to.eq(getLogoutMessage())

		await runNegativeRefreshTokenAttempt(app, rt1)

		// other refresh token should be valid
		const response2 = await request(app).post('/auth/refresh-token').send({
			refreshToken: rt2
		})

		expect(response2.statusCode).to.eq(200)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(response2.body.accessToken).to.exist
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(response2.body.refreshToken).to.exist
	})

	// test authorization header, since endpoint is using this header
	it(`No authorization header`, async () => {
		const response = await request(app).post('/auth/logout')

		expect(response.statusCode).to.eq(401)
	})

	it(`No access token`, async () => {
		const response = await request(app).post('/auth/logout').set('authorization', 'Bearer')

		expect(response.statusCode).to.eq(401)
	})

	it(`No access token, only ' '`, async () => {
		const response = await request(app).post('/auth/logout').set('authorization', 'Bearer ')

		expect(response.statusCode).to.eq(401)
	})

	it(`Logout removed user`, async () => {
		const token = await createJwt(
			{
				uid: 'Aaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
				rid: 'a',
				fid: 'a'
			},
			{
				audience: JWT_AUDIENCE.API_REFRESH,
				expiresIn: '15m'
			}
		)

		const response = await request(app).post('/auth/logout').set('authorization', `Bearer ${token}`)

		expect(response.statusCode).to.eq(401)
	})

	it(`Forged access token`, async () => {
		const user = getUser()
		const token = await createJwt(
			{
				uid: user.id,
				rid: 'a',
				fid: 'a'
			},
			{
				audience: JWT_AUDIENCE.API_REFRESH,
				expiresIn: '15m'
			},
			'aaaaaaaaaaaaaaaaaaaaaaaaa'
		)

		const response = await request(app).post('/auth/logout').set('authorization', `Bearer ${token}`)

		expect(response.statusCode).to.eq(401)
	})
})
describe('User logout w/o i18next', () => {
	const app = express()

	before(async () => {
		const userRepo = new UserRepository()

		await seedUsers(userRepo)

		// init authentication library
		initAuth(passport, {
			userRepository: userRepo,
			refreshTokenRepository: TokenRepository.getInstance()
		})

		app.use(express.urlencoded({ extended: true }))
		app.use(express.json())

		setupRouters(app)
	})

	it(`Successful user logout`, async () => {
		const user = getUser()
		await loginUserAndSetTokens(app, user)

		const response = await request(app).post('/auth/logout').set('authorization', `Bearer ${user.at}`)

		expect(response.statusCode).to.eq(200)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(response.body.messages[0].message).to.exist
		expect(response.body.messages[0].message).to.eq(getLogoutMessage())

		await runNegativeRefreshTokenAttempt(app, user.rt)
	})
})
