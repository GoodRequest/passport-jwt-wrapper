import passport from 'passport'
import express, { Express } from 'express'
import i18next from 'i18next'
import i18nextMiddleware from 'i18next-http-middleware'
import i18nextBackend from 'i18next-fs-backend'
import request, { Response } from 'supertest'

import { expect } from 'chai'
import { ApiAuth, initAuth, JWT_AUDIENCE, LogoutEverywhere, RefreshToken } from '../../../src'

import { UserRepository } from '../../mocks/repositories/userRepository'
import { RefreshTokenRepository } from '../../mocks/repositories/refreshTokenRepository'
import LoginRouter from '../../mocks/loginRouter'
import TestingEndpoint from '../../mocks/testingEndpoint'
import errorMiddleware from '../../mocks/middlewares/errorMiddleware'
import schemaMiddleware from '../../mocks/middlewares/schemaMiddleware'
import { getUser, languages, loginUserAndSetTokens, seedUsers } from '../../helpers'

import * as enTranslations from '../../../locales/en/translation.json'
import * as skTranslations from '../../../locales/sk/translation.json'
import { createJwt } from '../../../src/utils/jwt'
import { State } from '../../../src/State'

const i18NextConfig = State.getInstance().config.i18next

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

	loginRouter.post('/logout-everywhere', ApiAuth.guard(), schemaMiddleware(LogoutEverywhere.requestSchema), LogoutEverywhere.workflow)
	loginRouter.post('/refresh-token', schemaMiddleware(RefreshToken.requestSchema), RefreshToken.workflow)

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

function declarePositiveTests(lang?: string) {
	it(`${lang ? `[${lang}] ` : ''}Successful user logout`, async () => {
		const user = getUser()
		await loginUserAndSetTokens(app, user)

		const response = await request(app)
			.post('/auth/logout-everywhere')
			.set('accept-language', lang ?? 'sk')
			.set('authorization', `Bearer ${user.at}`)

		expect(response.statusCode).to.eq(200)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(response.body.messages[0].message).to.exist
		expect(response.body.messages[0].message).to.eq(getLogoutMessage(lang))

		await runNegativeRefreshTokenAttempt(user.rt)
	})
}

describe('Logout user from everywhere with i18next', () => {
	before(async () => {
		const userRepo = new UserRepository()

		await seedUsers(userRepo)

		// init authentication library
		initAuth(passport, {
			userRepository: userRepo,
			refreshTokenRepository: RefreshTokenRepository.getInstance()
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

		setupRouters()
	})

	languages.forEach((lang) => {
		declarePositiveTests(lang)
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
		const userRepo = new UserRepository()

		await seedUsers(userRepo)

		// init authentication library
		initAuth(passport, {
			userRepository: userRepo,
			refreshTokenRepository: RefreshTokenRepository.getInstance()
		})

		// init express app
		app = express()

		app.use(express.urlencoded({ extended: true }))
		app.use(express.json())

		setupRouters()
	})

	// no lang -> 'sk' is requested, 'en' is expected in response
	declarePositiveTests()
})

describe('Logout user from everywhere without proper initialization', () => {
	before(async () => {
		const userRepo = new UserRepository()

		await seedUsers(userRepo)

		const tokenRepo = RefreshTokenRepository.getInstance()

		// init authentication library
		initAuth(passport, {
			userRepository: userRepo,
			refreshTokenRepository: {
				createTokenID: tokenRepo.createTokenID.bind(tokenRepo),
				invalidateRefreshToken: tokenRepo.invalidateRefreshToken.bind(tokenRepo),
				invalidateRefreshTokenFamily: tokenRepo.invalidateRefreshTokenFamily.bind(tokenRepo),
				isRefreshTokenValid: tokenRepo.isRefreshTokenValid.bind(tokenRepo),
				saveRefreshToken: tokenRepo.saveRefreshToken.bind(tokenRepo)
				// invalidateUserRefreshTokens is missing
			}
		})

		// init express app
		app = express()

		app.use(express.urlencoded({ extended: true }))
		app.use(express.json())

		setupRouters()
	})

	it(`Missing "invalidateUserRefreshTokens"`, async () => {
		const user = getUser()
		await loginUserAndSetTokens(app, user)

		const response = await request(app).post('/auth/logout-everywhere').set('authorization', `Bearer ${user.at}`)

		expect(response.statusCode).to.eq(500)
		expect(response.body.messages[0].message).to.eq('Something went wrong!')
	})
})
