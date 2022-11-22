import express, { Express } from 'express'
import request from 'supertest'
import passport from 'passport'
import { expect } from 'chai'

import { ApiAuth, initAuth } from '../../../src'
import { UserRepository } from '../../mocks/userRepository'
import { loginUsers } from '../../seeds/users'
import { TokenRepository } from '../../mocks/tokenRepository'
import errorMiddleware from '../../mocks/errorMiddleware'
import loginRouter from '../../mocks/loginRouter'
import { loginUserAndSetTokens } from '../../helpers'

let app: Express
let userRepo: UserRepository

describe('Login Guard', () => {
	before(async () => {
		userRepo = new UserRepository()

		let promises: Promise<unknown>[] = []
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

		app.use('/auth', loginRouter())
		app.get('/endpoint', ApiAuth.guard(), (req, res) => {
			return res.sendStatus(200)
		})

		app.use(errorMiddleware)

		// login users and set tokens
		promises = []
		loginUsers.getAllPositiveValues().forEach((user) => {
			promises.push(loginUserAndSetTokens(app, user))
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
