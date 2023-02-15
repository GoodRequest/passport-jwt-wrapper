import express, { Express } from 'express'
import passport from 'passport'
import i18next, { InitOptions as I18nextOptions } from 'i18next'
import i18nextMiddleware from 'i18next-http-middleware'
import i18nextBackend from 'i18next-fs-backend'
import request from 'supertest'
import { expect } from 'chai'
import config from 'config'

import { initAuth, IPassportConfig, JWT_AUDIENCE } from '../../../src'

import { UserRepository } from '../../mocks/repositories/userRepository'
import { TokenRepository } from '../../mocks/repositories/tokenRepository'
import { createJwt } from '../../../src/utils/jwt'

import { getUser, languages, seedUserAndSetID, seedUsers, sleep } from '../../helpers'

import { PasswordResetTokenRepository } from '../../mocks/repositories/passwordResetTokenRepository'
import { callEndpoint, getPasswordToken, invalidPasswordResetTokenErrorString, passwordChangeString, setupRouters } from './helpers'

const i18NextConfig: I18nextOptions = config.get('passportJwtWrapper.i18next')
const passportConfig: IPassportConfig = config.get('passportJwtWrapper.passport')

function declareLanguageDependentTests(app: Express, userRepo: UserRepository, passwordResetTokenRepo: PasswordResetTokenRepository, language?: string) {
	it(`${language ? `[${language}] ` : ''}Removed user`, async () => {
		const user = getUser()
		const password = 'newPassword9'
		const token = await getPasswordToken(user.email)

		await userRepo.delete(user.id)

		const response = await callEndpoint(app, password, token, language)

		expect(response.statusCode).to.eq(401)
		expect(response.body.messages[0].message).to.eq(invalidPasswordResetTokenErrorString(language))

		// cleanup
		await seedUserAndSetID(userRepo, user)
	})

	it(`${language ? `[${language}] ` : ''}Invalidated token`, async () => {
		const user = getUser()
		const token = await getPasswordToken(user.email)
		const password = 'newPassword9'

		await passwordResetTokenRepo.invalidatePasswordResetToken(user.id)

		const response = await callEndpoint(app, password, token, language)

		expect(response.statusCode).to.eq(401)
		expect(response.body.messages[0].message).to.eq(invalidPasswordResetTokenErrorString(language))
	})

	it(`${language ? `[${language}] ` : ''}Already used token`, async () => {
		const user = getUser()

		const token = await getPasswordToken(user.email)
		const password = 'newPassword9'

		const response = await callEndpoint(app, password, token, language)

		expect(response.statusCode).to.eq(200)
		expect(response.body.messages[0].message).to.eq(passwordChangeString(language))

		const response2 = await callEndpoint(app, password, token, language)

		expect(response2.statusCode).to.eq(401)
		expect(response2.body.messages[0].message).to.eq(invalidPasswordResetTokenErrorString(language))
	})

	it(`${language ? `[${language}] ` : ''}Valid request`, async () => {
		const user = getUser()
		const token = await getPasswordToken(user.email)
		const password = 'newPassword9'

		const response = await callEndpoint(app, password, token, language)

		expect(response.statusCode).to.eq(200)
		expect(response.body.messages[0].message).to.eq(passwordChangeString(language))
	})
}

describe('Password reset endpoint w/o i18next', () => {
	const userRepo = new UserRepository()
	const passwordResetTokenRepo = new PasswordResetTokenRepository()
	const app = express()

	before(async () => {
		await seedUsers(userRepo)

		// init authentication library
		initAuth(passport, {
			userRepository: userRepo,
			refreshTokenRepository: TokenRepository.getInstance(),
			passwordResetTokenRepository: passwordResetTokenRepo
		})

		app.use(express.urlencoded({ extended: true }))
		app.use(express.json())

		setupRouters(app)
	})

	it('No token', async () => {
		const password = 'newPassword'
		const response = await request(app).post('/user/password-reset').send({
			password
		})

		expect(response.statusCode).to.eq(401)
	})

	it('Forged token', async () => {
		const loginUser = getUser()
		const user = await userRepo.getUserById(loginUser.id)
		if (!user) {
			throw new Error(`No user with id: ${loginUser.id}`)
		}

		const tokenPayload = {
			uid: user.id
		}

		const tokenOptions = {
			audience: JWT_AUDIENCE.PASSWORD_RESET,
			expiresIn: passportConfig.jwt.passwordReset.exp
		}

		const tokenSecret = `aaaaaaaaaaaaaaaaaaaa${user.hash}`
		const token = await createJwt(tokenPayload, tokenOptions, tokenSecret)

		const password = 'newPassword'
		const response = await callEndpoint(app, password, token)

		expect(response.statusCode).to.eq(401)
	})

	it('Expired token', async () => {
		const loginUser = getUser()
		const user = await userRepo.getUserById(loginUser.id)
		if (!user) {
			throw new Error(`No user with id: ${loginUser.id}`)
		}

		const tokenPayload = {
			uid: user.id
		}

		const tokenOptions = {
			audience: JWT_AUDIENCE.PASSWORD_RESET,
			expiresIn: '1s'
		}

		const tokenSecret = `${passportConfig.jwt.secretOrKey}${user.hash}`
		const token = await createJwt(tokenPayload, tokenOptions, tokenSecret)

		const password = 'newPassword'

		await sleep(1000)
		const response = await callEndpoint(app, password, token)

		expect(response.statusCode).to.eq(401)
	})

	it('Weak password', async () => {
		const user = getUser()
		const token = await getPasswordToken(user.email)
		const password = 'weak'

		const response = await callEndpoint(app, password, token)

		expect(response.statusCode).to.eq(400)
	})

	declareLanguageDependentTests(app, userRepo, passwordResetTokenRepo)
})

describe('Password reset endpoint with i18next', () => {
	const userRepo = new UserRepository()
	const passwordResetTokenRepo = new PasswordResetTokenRepository()
	const app = express()

	before(async () => {
		await seedUsers(userRepo)

		// i18next config
		await i18next
			.use(i18nextMiddleware.LanguageDetector)
			.use(i18nextBackend)
			.init(JSON.parse(JSON.stringify(i18NextConfig))) // it has to be deep copied

		app.use(i18nextMiddleware.handle(i18next))

		// init authentication library
		initAuth(passport, {
			userRepository: userRepo,
			refreshTokenRepository: TokenRepository.getInstance(),
			passwordResetTokenRepository: passwordResetTokenRepo
		})

		app.use(express.urlencoded({ extended: true }))
		app.use(express.json())

		setupRouters(app)
	})

	languages.forEach((lang) => {
		declareLanguageDependentTests(app, userRepo, passwordResetTokenRepo, lang)
	})
})

describe('Password reset endpoint w/o passwordResetTokenRepository', () => {
	const userRepo = new UserRepository()
	const app = express()

	before(async () => {
		await seedUsers(userRepo)

		// init authentication library
		initAuth(passport, {
			userRepository: userRepo,
			refreshTokenRepository: TokenRepository.getInstance()
		})

		app.use(express.urlencoded({ extended: true }))
		app.use(express.json())

		setupRouters(app)
	})

	it(`Valid request`, async () => {
		const user = getUser()
		const token = await getPasswordToken(user.email)
		const password = 'newPassword9'

		const response = await callEndpoint(app, password, token)

		expect(response.statusCode).to.eq(200)
		expect(response.body.messages[0].message).to.eq(passwordChangeString())
	})
})

// TODO: test how long does it take
