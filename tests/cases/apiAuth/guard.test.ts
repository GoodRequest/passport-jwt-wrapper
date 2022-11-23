import express, { Express } from 'express'
import request from 'supertest'
import passport from 'passport'
import { expect } from 'chai'

import { ApiAuth, initAuth, JWT_AUDIENCE } from '../../../src'
import { createJwt } from '../../../src/utils/jwt'

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
		const user = loginUsers.getPositiveValue()
		if (!user) {
			throw new Error('No positive user')
		}
		const response = await request(app).get('/endpoint').set('Authorization', `Bearer ${user.at}`)

		expect(response.statusCode).to.eq(200)
	})

	// TODO: translations
})
