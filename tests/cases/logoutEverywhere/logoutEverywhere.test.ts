import passport from 'passport'
import express, { Express } from 'express'
import i18next, { InitOptions as I18nextOptions } from 'i18next'
import i18nextMiddleware from 'i18next-http-middleware'
import i18nextBackend from 'i18next-fs-backend'
import config from 'config'
import request, { Response } from 'supertest'

import { expect } from 'chai'
import { ApiAuth, initAuth, JWT_AUDIENCE, LogoutEverywhere, RefreshToken } from '../../../src'

import { loginUsers } from '../../seeds/users'
import { UserRepository } from '../../mocks/userRepository'
import { TokenRepository } from '../../mocks/tokenRepository'
import LoginRouter from '../../mocks/loginRouter'
import TestingEndpoint from '../../mocks/testingEndpoint'
import errorMiddleware from '../../mocks/errorMiddleware'
import schemaMiddleware from '../../mocks/schemaMiddleware'
import { getUser, languages, loginUserAndSetTokens, seedUserAndSetID } from '../../helpers'

import * as enTranslations from '../../../locales/en/translation.json'
import * as skTranslations from '../../../locales/sk/translation.json'
import { createJwt } from '../../../src/utils/jwt'

const i18NextConfig: I18nextOptions = config.get('i18next')

let app: Express

function getLogoutMessage(language?: string): string {
	if (language && language === 'sk') {
		return skTranslations['You were successfully logged out']
	}

	return enTranslations['You were successfully logged out']
}

/**
 * Helper function for setting up express routers for testing
 */
function setupRouters() {
	const loginRouter = LoginRouter()

	loginRouter.post('/logout-everywhere', ApiAuth.guard(), schemaMiddleware(LogoutEverywhere.requestSchema), LogoutEverywhere.endpoint)
	loginRouter.post('/refresh-token', schemaMiddleware(RefreshToken.requestSchema), RefreshToken.endpoint)

	app.use('/auth', loginRouter)

	app.get('/endpoint', ApiAuth.guard(), TestingEndpoint)

	app.use(errorMiddleware)
}

async function runNegativeRefreshTokenAttempt(refreshToken: string): Promise<Response> {
	const response = await request(app).post('/auth/refresh-token').send({
		refreshToken
	})

	expect(response.statusCode).to.eq(401)

	return response
}

before(async () => {
	const userRepo = new UserRepository()

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

describe('Logout user from everywhere', () => {
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

	languages.forEach((lang) => {
		it(`[${lang}] Successful user logout`, async () => {
			const user = getUser()
			await loginUserAndSetTokens(app, user)

			const response = await request(app).post('/auth/logout-everywhere').set('accept-language', lang).set('authorization', `Bearer ${user.at}`)

			expect(response.statusCode).to.eq(200)
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(response.body.messages[0].message).to.exist
			expect(response.body.messages[0].message).to.eq(getLogoutMessage(lang))

			await runNegativeRefreshTokenAttempt(user.rt)
		})
	})

	it(`Other token is also not valid after successful user logout`, async () => {
		const user = getUser()
		await loginUserAndSetTokens(app, user)
		const { at, rt: rt1 } = user

		// login again - simulate other paralel session
		await loginUserAndSetTokens(app, user)
		const { rt: rt2 } = user

		const response = await request(app).post('/auth/logout-everywhere').set('authorization', `Bearer ${at}`)

		expect(response.statusCode).to.eq(200)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(response.body.messages[0].message).to.exist
		expect(response.body.messages[0].message).to.eq(getLogoutMessage())

		await runNegativeRefreshTokenAttempt(rt1)
		await runNegativeRefreshTokenAttempt(rt2)
	})

	// test authorization header, since endpoint is using this header
	it(`No authorization header`, async () => {
		const response = await request(app).post('/auth/logout-everywhere')

		expect(response.statusCode).to.eq(401)
	})

	it(`No access token`, async () => {
		const response = await request(app).post('/auth/logout-everywhere').set('authorization', 'Bearer')

		expect(response.statusCode).to.eq(401)
	})

	it(`No access token, only ' '`, async () => {
		const response = await request(app).post('/auth/logout-everywhere').set('authorization', 'Bearer ')

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

		const response = await request(app).post('/auth/logout-everywhere').set('authorization', `Bearer ${token}`)

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

		const response = await request(app).post('/auth/logout-everywhere').set('authorization', `Bearer ${token}`)

		expect(response.statusCode).to.eq(401)
	})
})

describe('Logout user without i18next', () => {
	before(async () => {
		// init express app
		app = express()

		app.use(express.urlencoded({ extended: true }))
		app.use(express.json())

		setupRouters()
	})

	// TODO: logout without i18next
	// no lang -> 'sk' is requested, 'en' is expected in response
	// declareNegativeTests()
})
