import passport from 'passport'
import express from 'express'
import i18next from 'i18next'
import i18nextMiddleware from 'i18next-http-middleware'
import i18nextBackend from 'i18next-fs-backend'
import request from 'supertest'
import { expect } from 'chai'

import { initAuth } from '../../../src'

import { UserRepository } from '../../mocks/repositories/userRepository'
import { RefreshTokenRepository } from '../../mocks/repositories/refreshTokenRepository'

import { getUser, languages, loginUserAndSetTokens, seedUsers } from '../../helpers'
import { getLogoutMessage, setupRouters } from './helpers'

import * as skErrors from '../../../locales/sk/error.json'
import * as enErrors from '../../../locales/en/error.json'
import { State } from '../../../src/State'

function getErrorMessage(language?: string): string {
	if (language && language === 'sk') {
		return skErrors['Access token is not valid']
	}

	return enErrors['Access token is not valid']
}

describe('User logout check access token with i18next', () => {
	const app = express()

	before(async () => {
		const userRepo = new UserRepository()

		await seedUsers(userRepo)

		// init authentication library
		initAuth(
			passport,
			{
				userRepository: userRepo,
				refreshTokenRepository: RefreshTokenRepository.getInstance()
			},
			{
				checkAccessToken: true
			}
		)

		app.use(express.urlencoded({ extended: true }))
		app.use(express.json())

		const i18NextConfig = State.getInstance().config.i18next

		// i18next config
		await i18next
			.use(i18nextMiddleware.LanguageDetector)
			.use(i18nextBackend)
			.init(JSON.parse(JSON.stringify(i18NextConfig))) // it has to be deep copied

		app.use(i18nextMiddleware.handle(i18next))

		setupRouters(app)
	})

	languages.forEach((lang) => {
		it(`[${lang}] Test endpoint after successful logout`, async () => {
			const user = getUser()
			await loginUserAndSetTokens(app, user)

			const response = await request(app).post('/auth/logout').set('accept-language', lang).set('authorization', `Bearer ${user.at}`)

			expect(response.statusCode).to.eq(200)
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(response.body.messages[0].message).to.exist
			expect(response.body.messages[0].message).to.eq(getLogoutMessage(lang))

			const response2 = await request(app).get('/endpoint').set('accept-language', lang).set('authorization', `Bearer ${user.at}`)

			expect(response2.statusCode).to.eq(401)
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			expect(response2.body.messages[0].message).to.exist
			expect(response2.body.messages[0].message).to.eq(getErrorMessage(lang))
		})
	})
})
