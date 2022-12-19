import express from 'express'
import request from 'supertest'
import { expect } from 'chai'

import { ApiAuth } from '../../src'

import errorMiddleware from '../mocks/middlewares/errorMiddleware'
import TestingEndpoint from '../mocks/testingEndpoint'

describe('Initialization', () => {
	it('Usage without initialization', async () => {
		try {
			const app = express()

			app.get('/endpoint', ApiAuth.guard(), TestingEndpoint)
			app.use(errorMiddleware)

			await request(app).get('/endpoint')
		} catch (e) {
			expect((<Error>e).message).to.eq("Authentication library ('@goodrequest/passport-jwt-wrapper') is not initialized")
		}
	})
})
