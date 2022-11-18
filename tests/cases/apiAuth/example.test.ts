import express, { Express } from 'express'
import i18next, { InitOptions as I18nextOptions } from 'i18next'
import i18nextMiddleware from 'i18next-http-middleware'
import i18nextBackend from 'i18next-fs-backend'
import config from 'config'
import request, { Response } from 'supertest'
import { expect } from 'chai'
import passport from 'passport'

import { initAuth } from '../../../src'
import { UserRepository } from '../../mocks/userRepository'
import { TokenRepository } from '../../mocks/tokenRepository'
import loginRouter from '../../mocks/loginRouter'
import errorMiddleware from '../../mocks/errorMiddleware'
import { loginUsers } from '../../seeds/users'

import * as enErrors from '../../../locales/en/error.json'
import * as skErrors from '../../../locales/sk/error.json'

const i18NextConfig: I18nextOptions = config.get('i18next')

let app: Express

const languages = ['en', 'sk']

function incorrectPasswordErrorString(language?: string): string {
	if (language && language === 'sk') {
		return skErrors['Incorrect email or password']
	}

	return enErrors['Incorrect email or password']
}

before(async () => {
	const userRepo = new UserRepository()

	const promises: Promise<void>[] = []
	// seed users
	Object.entries(loginUsers).forEach(([, user]) => {
		if (user.isValid && user.isPositive) {
			promises.push(userRepo.add(user.email.value, user.password?.value))
		}
	})

	await Promise.all(promises)

	// init express app
	app = express()

	app.use(express.urlencoded({ extended: true }))
	app.use(express.json())
	app.use(passport.initialize())

	// init authentication library
	initAuth(passport, {
		userRepository: userRepo,
		refreshTokenRepository: TokenRepository.getInstance()
	})
})

function testInvalidResponse(response: Response, lang?: string): void {
	expect(response.statusCode).to.eq(401)
	// eslint-disable-next-line @typescript-eslint/no-unused-expressions
	expect(response.body.messages).to.exist
	expect(response.body.messages[0]).to.eq(incorrectPasswordErrorString(lang))
}

describe('Login with i18next', () => {
	before(async () => {
		// i18next config
		await i18next
			.use(i18nextMiddleware.LanguageDetector)
			.use(i18nextBackend)
			.init(JSON.parse(JSON.stringify(i18NextConfig))) // it has to be deep copied

		app.use(i18nextMiddleware.handle(i18next))

		app.use('/auth', loginRouter())
		app.use(errorMiddleware)
	})

	Object.entries(loginUsers).forEach(([, user]) => {
		if (user.isValid && user.isPositive) {
			// eslint-disable-next-line @typescript-eslint/no-loop-func
			it(`Testing valid user: ${user}`, async () => {
				const response = await request(app).post('/auth/login').send({
					email: user.email.value,
					password: user.password?.value
				})

				expect(response.statusCode).to.eq(200)
				// eslint-disable-next-line @typescript-eslint/no-unused-expressions
				expect(response.body.accessToken).to.exist
				// eslint-disable-next-line @typescript-eslint/no-unused-expressions
				expect(response.body.refreshToken).to.exist
			})
		} else {
			languages.forEach((lang) => {
				// eslint-disable-next-line @typescript-eslint/no-loop-func
				it(`[${lang}] Testing invalid user: ${user}`, async () => {
					const response = await request(app).post('/auth/login').set('Accept-Language', lang).send({
						email: user.email.value,
						password: user.password?.value
					})

					testInvalidResponse(response, lang)
				})
			})
		}
	})

	languages.forEach((lang) => {
		it(`[${lang}] No email`, async () => {
			const response = await request(app).post('/auth/login').set('Accept-Language', lang).send({
				password: 'testPass1234.'
			})

			testInvalidResponse(response, lang)
		})

		it(`[${lang}] No data`, async () => {
			const response = await request(app).post('/auth/login').set('Accept-Language', lang)

			testInvalidResponse(response, lang)
		})
	})
})

describe('Login without i18next', () => {
	before(async () => {
		app.use('/auth', loginRouter())
		app.use(errorMiddleware)
	})

	// eslint-disable-next-line no-restricted-syntax
	for (const [, user] of Object.entries(loginUsers)) {
		if (user.isValid && user.isPositive) {
			// eslint-disable-next-line @typescript-eslint/no-loop-func
			it(`Testing valid user: ${user}`, async () => {
				const response = await request(app).post('/auth/login').send({
					email: user.email.value,
					password: user.password?.value
				})

				expect(response.statusCode).to.eq(200)
				// eslint-disable-next-line @typescript-eslint/no-unused-expressions
				expect(response.body.accessToken).to.exist
				// eslint-disable-next-line @typescript-eslint/no-unused-expressions
				expect(response.body.refreshToken).to.exist
			})
		} else {
			// eslint-disable-next-line @typescript-eslint/no-loop-func
			languages.forEach((lang) => {
				it(`[${lang}] Testing invalid user: ${user}`, async () => {
					const response = await request(app).post('/auth/login').set('Accept-Language', lang).send({
						email: user.email.value,
						password: user.password?.value
					})

					testInvalidResponse(response, lang)
				})
			})
		}
	}

	languages.forEach((lang) => {
		it(`[${lang}] No email`, async () => {
			const response = await request(app).post('/auth/login').set('Accept-Language', lang).send({
				password: 'testPass1234.'
			})

			testInvalidResponse(response, lang)
		})

		it(`[${lang}] No data`, async () => {
			const response = await request(app).post('/auth/login').set('Accept-Language', lang)

			testInvalidResponse(response, lang)
		})
	})
})
