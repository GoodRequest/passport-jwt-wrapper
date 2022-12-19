import express, { Express } from 'express'
import i18next, { InitOptions as I18nextOptions } from 'i18next'
import i18nextMiddleware from 'i18next-http-middleware'
import i18nextBackend from 'i18next-fs-backend'
import config from 'config'
import request, { Response } from 'supertest'
import passport from 'passport'
import { expect } from 'chai'

import { initAuth } from '../../../src'
import { UserRepository } from '../../mocks/repositories/userRepository'
import { TokenRepository } from '../../mocks/repositories/tokenRepository'
import loginRouter from '../../mocks/loginRouter'
import errorMiddleware from '../../mocks/middlewares/errorMiddleware'
import { LoginUserProperty, loginUsers } from '../../seeds/users'
import { getUser, languages, seedUserAndSetID, seedUsers } from '../../helpers'

import * as enErrors from '../../../locales/en/error.json'
import * as skErrors from '../../../locales/sk/error.json'

const i18NextConfig: I18nextOptions = config.get('i18next')

let app: Express

let userRepo: UserRepository

/**
 * returns error string based on language
 * en is default
 * @param language
 */
function incorrectPasswordErrorString(language?: string): string {
	if (language && language === 'sk') {
		return skErrors['Incorrect email or password']
	}

	return enErrors['Incorrect email or password']
}

/**
 * tests response for invalid call
 * default language is en
 * @param response
 * @param lang
 */
function expectInvalidResponse(response: Response, lang?: string): void {
	expect(response.statusCode).to.eq(401)
	// eslint-disable-next-line @typescript-eslint/no-unused-expressions
	expect(response.body.messages).to.exist
	expect(response.body.messages[0].message).to.eq(incorrectPasswordErrorString(lang))
}

before(async () => {
	userRepo = new UserRepository()

	await seedUsers(userRepo)

	// init authentication library
	initAuth(passport, {
		userRepository: userRepo,
		refreshTokenRepository: TokenRepository.getInstance()
	})
})

describe('Login with i18next', () => {
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

		app.use('/auth', loginRouter())
		app.use(errorMiddleware)
	})

	loginUsers.getAllPositiveValues().forEach((user) => {
		it(`Testing valid user: ${user}`, async () => {
			const response = await request(app).post('/auth/login').send({
				email: user.email,
				password: user.password
			})

			expect(response.statusCode).to.eq(200)
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(response.body.accessToken).to.exist
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(response.body.refreshToken).to.exist
		})
	})

	const invalidUsers = loginUsers.getAllNegativeValues()
	invalidUsers.push(...loginUsers.getAllInvalidValues())
	invalidUsers.forEach((user) => {
		languages.forEach((lang) => {
			// eslint-disable-next-line @typescript-eslint/no-loop-func
			it(`[${lang}] Testing invalid user: ${user}`, async () => {
				const response = await request(app).post('/auth/login').set('Accept-Language', lang).send({
					email: user.email,
					password: user.password
				})

				expectInvalidResponse(response, lang)
			})
		})
	})

	languages.forEach((lang) => {
		it(`[${lang}] No email`, async () => {
			const response = await request(app).post('/auth/login').set('Accept-Language', lang).send({
				password: 'testPass1234.'
			})

			expectInvalidResponse(response, lang)
		})

		it(`[${lang}] No data`, async () => {
			const response = await request(app).post('/auth/login').set('Accept-Language', lang)

			expectInvalidResponse(response, lang)
		})
	})
})

describe('Login without i18next', () => {
	before(async () => {
		// init express app
		app = express()

		app.use(express.urlencoded({ extended: true }))
		app.use(express.json())

		app.use('/auth', loginRouter())
		app.use(errorMiddleware)
	})

	loginUsers.getAllPositiveValues().forEach((user) => {
		it(`Testing valid user: ${user}`, async () => {
			const response = await request(app).post('/auth/login').send({
				email: user.email,
				password: user.password
			})

			expect(response.statusCode).to.eq(200)
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(response.body.accessToken).to.exist
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(response.body.refreshToken).to.exist
		})
	})

	const invalidUsers = loginUsers.getAllNegativeValues()
	invalidUsers.push(...loginUsers.getAllInvalidValues())
	invalidUsers.forEach((user) => {
		languages.forEach((lang) => {
			// eslint-disable-next-line @typescript-eslint/no-loop-func
			it(`[${lang}] Testing invalid user: ${user}`, async () => {
				const response = await request(app).post('/auth/login').set('Accept-Language', lang).send({
					email: user.email,
					password: user.password
				})

				expectInvalidResponse(response)
			})
		})
	})

	it('No email', async () => {
		const response = await request(app).post('/auth/login').set('Accept-Language', 'sk').send({
			password: 'testPass1234.'
		})

		// message should be in EN
		expectInvalidResponse(response)
	})

	it('No data', async () => {
		const response = await request(app).post('/auth/login').set('Accept-Language', 'sk')

		// message should be in EN
		expectInvalidResponse(response)
	})

	it(`User without set password`, async () => {
		const user = loginUsers.getNegativeUser([LoginUserProperty.NO_PASS])
		if (!user) {
			throw new Error('Cannot get user without password')
		}

		// seed "invalid" user (without password)
		await seedUserAndSetID(userRepo, user)

		const response = await request(app).post('/auth/login').send({
			email: user.email,
			password: 'SomeRandomPassword'
		})

		expect(response.statusCode).to.eq(401)
	})

	it(`Wrong pass`, async () => {
		const user = getUser()

		const response = await request(app).post('/auth/login').send({
			email: user.email,
			password: 'WrongPassword'
		})

		expect(response.statusCode).to.eq(401)
	})
})
