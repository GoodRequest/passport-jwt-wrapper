import express from 'express'
import passport from 'passport'
import { expect } from 'chai'

import jsonwebtoken from 'jsonwebtoken'
import { getUser, seedUsers } from '../../helpers'
import { IJwtPayload, initAuth, IRefreshJwtPayload, Login } from '../../../src'

import { UserRepository } from '../../mocks/repositories/userRepository'
import { PasswordResetTokenRepository } from '../../mocks/repositories/passwordResetTokenRepository'
import { RefreshTokenRepository } from '../../mocks/repositories/refreshTokenRepository'

describe('Password reset: getToken method', () => {
	const userRepo = new UserRepository()
	const passwordResetTokenRepo = new PasswordResetTokenRepository()
	const app = express()

	before(async () => {
		await seedUsers(userRepo)

		// init authentication library
		initAuth(passport, {
			userRepository: userRepo,
			refreshTokenRepository: RefreshTokenRepository.getInstance(),
			passwordResetTokenRepository: passwordResetTokenRepo
		})

		app.use(express.urlencoded({ extended: true }))
		app.use(express.json())
	})

	it('No Family ID', async () => {
		const user = getUser()
		const result = await Login.getTokens(user.email)

		/* eslint-disable @typescript-eslint/no-unused-expressions */
		expect(result).to.exist
		expect(result.accessToken).to.exist
		expect(result.refreshToken).to.exist
		/* eslint-enable */

		const decodedAccessTokenData = <IJwtPayload & { id: number; permission: string }>jsonwebtoken.decode(result.accessToken)
		const decodedRefreshTokenData = <IRefreshJwtPayload>jsonwebtoken.decode(result.refreshToken)

		const { rid } = decodedAccessTokenData
		expect(decodedAccessTokenData.fid).to.eq(rid)
		expect(decodedRefreshTokenData.fid).to.eq(rid)
		expect(decodedRefreshTokenData.jti).to.eq(rid)
	})

	it('With Family ID', async () => {
		const user = getUser()
		const familyID = 123456
		const result = await Login.getTokens(user.email, familyID)

		/* eslint-disable @typescript-eslint/no-unused-expressions */
		expect(result).to.exist
		expect(result.accessToken).to.exist
		expect(result.refreshToken).to.exist
		/* eslint-enable */

		const decodedAccessTokenData = <IJwtPayload & { id: number; permission: string }>jsonwebtoken.decode(result.accessToken)
		const decodedRefreshTokenData = <IRefreshJwtPayload>jsonwebtoken.decode(result.refreshToken)
		expect(decodedAccessTokenData.fid).to.eq(familyID)
		expect(decodedRefreshTokenData.fid).to.eq(familyID)
		expect(decodedRefreshTokenData.jti).to.not.eq(familyID)
		const { rid } = decodedAccessTokenData
		expect(decodedRefreshTokenData.jti).to.eq(rid)
	})

	it('With payload', async () => {
		const user = getUser()
		const result = await Login.getTokens(user.email, undefined, { id: 5, permission: 'ADMINISTRATOR' })

		/* eslint-disable @typescript-eslint/no-unused-expressions */
		expect(result).to.exist
		expect(result.accessToken).to.exist
		expect(result.refreshToken).to.exist

		/* eslint-enable */

		const decodedAccessTokenData = <IJwtPayload & { id: number; permission: string }>jsonwebtoken.decode(result.accessToken)
		const decodedRefreshTokenData = <IRefreshJwtPayload>jsonwebtoken.decode(result.refreshToken)
		expect(decodedAccessTokenData.id).to.eq(5)
		expect(decodedAccessTokenData.permission).to.eq('ADMINISTRATOR')
		const { fid: familyID, rid } = decodedAccessTokenData
		expect(decodedAccessTokenData.fid).to.eq(familyID)
		expect(decodedRefreshTokenData.fid).to.eq(familyID)
		expect(decodedRefreshTokenData.jti).to.eq(familyID)
		expect(decodedRefreshTokenData.jti).to.eq(rid)
	})
})
