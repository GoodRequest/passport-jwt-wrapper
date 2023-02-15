import express, { Express } from 'express'
import request from 'supertest'
import passport from 'passport'
import { expect } from 'chai'
import i18next, { InitOptions as I18nextOptions } from 'i18next'
import i18nextMiddleware from 'i18next-http-middleware'
import i18nextBackend from 'i18next-fs-backend'
import config from 'config'

import { ApiAuth, initAuth, JWT_AUDIENCE } from '../../../src'
import { createJwt } from '../../../src/utils/jwt'

import { getUser, languages, loginUserAndSetTokens, seedUsers } from '../../helpers'
import { UserRepository } from '../../mocks/repositories/userRepository'
import { TokenRepository } from '../../mocks/repositories/tokenRepository'
import errorMiddleware from '../../mocks/middlewares/errorMiddleware'
import loginRouter from '../../mocks/loginRouter'
import TestingEndpoint from '../../mocks/testingEndpoint'

import * as enErrors from '../../../locales/en/error.json'
import * as skErrors from '../../../locales/sk/error.json'

const i18NextConfig: I18nextOptions = config.get('passportJwtWrapper.i18next')

function setupRouters(app: Express) {
	app.use('/auth', loginRouter())
	app.get('/endpoint', ApiAuth.guard(), TestingEndpoint)

	app.use(errorMiddleware)
}

function declareLanguageDependentTests(app: Express, userRepo: UserRepository, language?: string) {
	it(`${language ? `[${language}] ` : ''}Removed user`, async () => {
		const user = getUser()
		await userRepo.delete(user.id)

		const response = await request(app)
			.get('/endpoint')
			.set('accept-language', language ?? 'sk')
			.set('Authorization', `Bearer ${user.at}`)

		expect(response.statusCode).to.eq(401)
		if (language && language === 'sk') {
			expect(response.body.messages[0].message).to.eq(skErrors['User was not found'])
		} else {
			expect(response.body.messages[0].message).to.eq(enErrors['User was not found'])
		}
	})
}

describe('Login Guard w/o i18next', () => {
	const userRepo = new UserRepository()
	const app = express()

	before(async () => {
		// init authentication library
		initAuth(passport, {
			userRepository: userRepo,
			refreshTokenRepository: TokenRepository.getInstance()
		})

		app.use(express.urlencoded({ extended: true }))
		app.use(express.json())

		setupRouters(app)
	})

	beforeEach(async () => {
		const users = await seedUsers(userRepo)

		const promises: Promise<void>[] = []
		users.forEach((u) => {
			promises.push(loginUserAndSetTokens(app, u))
		})

		await Promise.all(promises)
	})

	it(`No access token`, async () => {
		const response = await request(app).get('/endpoint').set('Authorization', `Bearer`)

		expect(response.statusCode).to.eq(401)
		// no message
	})

	it(`No access token with ' ' `, async () => {
		const response = await request(app).get('/endpoint').set('Authorization', `Bearer `)

		expect(response.statusCode).to.eq(401)
	})

	it(`No Authorization header`, async () => {
		const response = await request(app).get('/endpoint')

		expect(response.statusCode).to.eq(401)
	})

	it(`Forged access token`, async () => {
		const token = await createJwt(
			{
				uid: 'aaaaaaaaaaa',
				rid: 'a',
				fid: 'a'
			},
			{
				audience: JWT_AUDIENCE.API_ACCESS,
				expiresIn: '15m'
			},
			'aaaaaaaaaaaaaaaaaaaaaaaaa'
		)

		const response = await request(app).get('/endpoint').set('Authorization', `Bearer ${token}`)

		expect(response.statusCode).to.eq(401)
	})

	it('User login', async () => {
		const user = getUser()
		const response = await request(app).get('/endpoint').set('Authorization', `Bearer ${user.at}`)

		expect(response.statusCode).to.eq(200)
	})

	declareLanguageDependentTests(app, userRepo)
})
describe('Login Guard with i18 next', () => {
	const userRepo = new UserRepository()
	const app = express()

	before(async () => {
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

	beforeEach(async () => {
		const users = await seedUsers(userRepo)

		const promises: Promise<void>[] = []
		users.forEach((u) => {
			promises.push(loginUserAndSetTokens(app, u))
		})

		await Promise.all(promises)
	})

	languages.forEach((lang) => {
		declareLanguageDependentTests(app, userRepo, lang)
	})
})
