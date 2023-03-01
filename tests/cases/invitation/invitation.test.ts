import express, { AuthRequest, Express, Router } from 'express'
import passport from 'passport'
import i18next, { InitOptions as I18nextOptions } from 'i18next'
import i18nextMiddleware from 'i18next-http-middleware'
import i18nextBackend from 'i18next-fs-backend'
import request, { Response } from 'supertest'
import { expect } from 'chai'
import config from 'config'

import { initAuth, Invitation, IPassportConfig, JWT_AUDIENCE } from '../../../src'

import { UserRepository } from '../../mocks/repositories/userRepository'
import { RefreshTokenRepository } from '../../mocks/repositories/refreshTokenRepository'
import errorMiddleware from '../../mocks/middlewares/errorMiddleware'
import { createJwt } from '../../../src/utils/jwt'

import * as enErrors from '../../../locales/en/error.json'
import * as skErrors from '../../../locales/sk/error.json'
import { InvitationTokenRepository } from '../../mocks/repositories/invitationTokenRepository'
import { languages } from '../../helpers'

const i18NextConfig: I18nextOptions = config.get('passportJwtWrapper.i18next')
const passportConfig: IPassportConfig = config.get('passportJwtWrapper.passport')

function sleep(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

/**
 * returns error string based on language
 * en is default
 * @param language
 */
function userNotFoundErrorString(language?: string): string {
	if (language && language === 'sk') {
		return skErrors['User was not found']
	}

	return enErrors['User was not found']
}

function invalidInvitationErrorString(language?: string): string {
	if (language && language === 'sk') {
		return skErrors['Invitation token is not valid']
	}

	return enErrors['Invitation token is not valid']
}

/**
 * Helper function for setting up express routers for testing
 */
function setupRouters(app: Express, invitationTokenRepo: InvitationTokenRepository) {
	const userRouter = Router()
	userRouter.post('/confirm', Invitation.guard(), async (req, res) => {
		const { user } = req as AuthRequest
		await invitationTokenRepo.invalidateInvitationToken(user.id) // we need to invalidate user token
		return res.sendStatus(200)
	})

	app.use('/user', userRouter)

	app.use(errorMiddleware)
}

function callTestEndpoint(app: Express, token: string, lang?: string): Promise<Response> {
	return request(app)
		.post('/user/confirm')
		.set('accept-language', lang ?? 'sk')
		.set('authorization', `Bearer ${token}`)
}

function declareTestsWithMessageResponse(app: Express, invitationTokenRepo: InvitationTokenRepository, userRepo: UserRepository, lang?: string) {
	it(`${lang ? `[${lang}] ` : ''}Invalidated token`, async () => {
		const user = await userRepo.invite('newUser@gmail.com')
		const token = await Invitation.getToken(user.id)

		await invitationTokenRepo.invalidateInvitationToken(user.id)

		const response = await callTestEndpoint(app, token, lang)

		expect(response.statusCode).to.eq(401)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(response.body.messages).to.exist
		expect(response.body.messages[0].message).to.eq(invalidInvitationErrorString(lang))
	})

	it(`${lang ? `[${lang}] ` : ''}Already used invitation token`, async () => {
		const user = await userRepo.invite('newUser@gmail.com')
		const token = await Invitation.getToken(user.id)

		const response = await request(app)
			.post('/user/confirm')
			.set('accept-language', lang ?? 'sk')
			.set('authorization', `Bearer ${token}`)

		expect(response.statusCode).to.eq(200)

		const response2 = await callTestEndpoint(app, token, lang)

		expect(response2.statusCode).to.eq(401)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(response2.body.messages).to.exist
		expect(response2.body.messages[0].message).to.eq(invalidInvitationErrorString(lang))
	})

	it(`${lang ? `[${lang}] ` : ''}Removed user`, async () => {
		const user = await userRepo.invite('newUser@gmail.com')
		const token = await Invitation.getToken(user.id)

		await userRepo.delete(user.id)

		const response = await callTestEndpoint(app, token, lang)

		expect(response.statusCode).to.eq(401)
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(response.body.messages).to.exist
		expect(response.body.messages[0].message).to.eq(userNotFoundErrorString(lang))
	})
}

describe('Invitation Token endpoint without i18next', () => {
	const userRepo = new UserRepository()
	const invitationTokenRepo = new InvitationTokenRepository()
	const app = express()

	before(() => {
		// init authentication library
		initAuth(passport, {
			userRepository: userRepo,
			refreshTokenRepository: RefreshTokenRepository.getInstance(),
			invitationTokenRepository: invitationTokenRepo
		})

		app.use(express.urlencoded({ extended: true }))
		app.use(express.json())

		setupRouters(app, invitationTokenRepo)
	})

	it(`Valid invitation`, async () => {
		const user = await userRepo.invite('newUser@gmail.com')
		const token = await Invitation.getToken(user.id)

		const response = await request(app).post('/user/confirm').set('authorization', `Bearer ${token}`)

		expect(response.statusCode).to.eq(200)
	})

	// no lang -> 'sk' is requested, 'en' is expected in response
	declareTestsWithMessageResponse(app, invitationTokenRepo, userRepo)

	it(`Forged token`, async () => {
		const tokenPayload = {
			uid: 'user42'
		}

		const tokenOptions = {
			audience: JWT_AUDIENCE.INVITATION,
			expiresIn: passportConfig.jwt.invitation.exp
		}

		const token = await createJwt(tokenPayload, tokenOptions, 'badsecret')

		const response = await request(app).post('/user/confirm').set('authorization', `Bearer ${token}`)

		expect(response.statusCode).to.eq(401)
	})

	it(`Expired token`, async () => {
		const tokenPayload = {
			uid: 'user42'
		}

		const tokenOptions = {
			audience: JWT_AUDIENCE.INVITATION,
			expiresIn: '1s'
		}

		const token = await createJwt(tokenPayload, tokenOptions)

		await sleep(100)
		const response = await callTestEndpoint(app, token)

		expect(response.statusCode).to.eq(401)
	})
})

describe('Invitation Token endpoint with i18next', () => {
	const userRepo = new UserRepository()
	const invitationTokenRepo = new InvitationTokenRepository()
	const app = express()

	before(async () => {
		// init authentication library
		initAuth(passport, {
			userRepository: userRepo,
			refreshTokenRepository: RefreshTokenRepository.getInstance(),
			invitationTokenRepository: invitationTokenRepo
		})

		app.use(express.urlencoded({ extended: true }))
		app.use(express.json())

		// i18next config
		await i18next
			.use(i18nextMiddleware.LanguageDetector)
			.use(i18nextBackend)
			.init(JSON.parse(JSON.stringify(i18NextConfig))) // it has to be deep copied

		app.use(i18nextMiddleware.handle(i18next))

		setupRouters(app, invitationTokenRepo)
	})

	languages.forEach((lang) => declareTestsWithMessageResponse(app, invitationTokenRepo, userRepo, lang))
})
