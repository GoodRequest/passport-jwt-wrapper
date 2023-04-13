import passport from 'passport'
import express from 'express'
import i18next from 'i18next'
import i18nextMiddleware from 'i18next-http-middleware'
import i18nextBackend from 'i18next-fs-backend'
import request from 'supertest'

import { expect } from 'chai'
import { initAuth, JWT_AUDIENCE } from '../../../src'

import { UserRepository } from '../../mocks/repositories/userRepository'
import { RefreshTokenRepository } from '../../mocks/repositories/refreshTokenRepository'
import { getUser, languages, loginUserAndSetTokens, seedUsers, testEndpoint } from '../../helpers'

import { createJwt } from '../../../src/utils/jwt'
import { getLogoutMessage, runNegativeRefreshTokenAttempt, setupRouters } from './helpers'
import { State } from '../../../src/State'

const i18NextConfig = State.getInstance().config.i18next

/**
 * Helper function for setting up express routers for testing
 */
describe('User logout with i18next', () => {
	const app = express()

	before(async () => {
		const userRepo = new UserRepository()

		await seedUsers(userRepo)

		// init authentication library
		initAuth(passport, {
			userRepository: userRepo,
			refreshTokenRepository: RefreshTokenRepository.getInstance()
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

			await testEndpoint(app, user.at)
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
			refreshTokenRepository: RefreshTokenRepository.getInstance()
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
