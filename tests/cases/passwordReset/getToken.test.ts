import express from 'express'
import passport from 'passport'
import { expect } from 'chai'

import { getUser, seedUsers } from '../../helpers'
import { initAuth, PasswordReset } from '../../../src'

import { UserRepository } from '../../mocks/repositories/userRepository'
import { PasswordResetTokenRepository } from '../../mocks/repositories/passwordResetTokenRepository'
import { TokenRepository } from '../../mocks/repositories/tokenRepository'

function declareTests() {
	it('Non existing email', async () => {
		const result = await PasswordReset.getToken('nonexisting@email.com')

		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(result).to.be.undefined
	})

	it('Valid email', async () => {
		const user = getUser()
		const result = await PasswordReset.getToken(user.email)

		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		expect(result).to.exist
	})
}

describe('Password reset: getToken method', () => {
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
	})

	declareTests()
})

describe('Password reset: getToken method without password reset token repository', () => {
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
	})

	declareTests()
})
