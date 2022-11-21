import express, { Express } from 'express'
import request from 'supertest'
import passport from 'passport'
import i18next, { InitOptions as I18nextOptions } from 'i18next'
import i18nextMiddleware from 'i18next-http-middleware'
import i18nextBackend from 'i18next-fs-backend'
import config from 'config'
import { expect } from 'chai'

import { ApiAuth, initAuth } from '../../../src'
import { UserRepository } from '../../mocks/userRepository'
import { LoginUser, loginUsers } from '../../seeds/users'
import { TokenRepository } from '../../mocks/tokenRepository'
import errorMiddleware from '../../mocks/errorMiddleware'
import loginRouter from '../../mocks/loginRouter'

const i18NextConfig: I18nextOptions = config.get('i18next')

let app: Express
let userRepo: UserRepository

async function loginUser(user: LoginUser): Promise<void> {
	const response = await request(app).post('/auth/login').send({
		email: user.email,
		password: user.password
	})

	const { accessToken, refreshToken } = response.body
	user.setTokens(accessToken, refreshToken)
}

describe('Login Guard', () => {
	before(async () => {
		userRepo = new UserRepository()

		let promises: Promise<void>[] = []
		// seed users
		loginUsers.getAllPositiveValues().forEach((user) => {
			promises.push(userRepo.add(user.email, user.password))
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

		app.use('/auth', loginRouter())
		app.get('/endpoint', ApiAuth.guard(), (req, res) => {
			return res.sendStatus(200)
		})

		app.use(errorMiddleware)

		// login users and set tokens
		promises = []
		loginUsers.getAllPositiveValues().forEach((user) => {
			promises.push(loginUser(user))
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

	it('User login', async () => {
		const user = loginUsers.getPositiveValue()
		const response = await request(app).get('/endpoint').set('Authorization', `Bearer ${user?.accessToken}`)

		expect(response.statusCode).to.eq(200)
	})
})
