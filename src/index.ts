// eslint-disable-next-line import/no-extraneous-dependencies
import { PassportStatic } from 'passport'

import * as ApiAuth from './apiAuth'
import * as Login from './login'
import * as Logout from './logout'
import * as LogoutEverywhere from './logoutEverywhere'
import * as PasswordReset from './passwordReset'
import * as RefreshToken from './refreshToken'
import * as Invitation from './invitation'

import {
	ID,
	IJwtPayload,
	IRefreshJwtPayload,
	IUserRepository,
	IRefreshTokenRepository,
	IInvitationTokenRepository,
	IPasswordResetTokenRepository
} from './types/interfaces'
import { IPassportConfig } from './types/config'
import { State } from './State'
import { JWT_AUDIENCE, PASSPORT_NAME } from './utils/enums'
import { createHash } from './utils/jwt'

function initAuth<TokenIDType extends ID, UserIDType extends ID>(
	passport: PassportStatic,
	repositories: {
		userRepository: IUserRepository<UserIDType>
		refreshTokenRepository: IRefreshTokenRepository<TokenIDType, UserIDType>
		invitationTokenRepository?: IInvitationTokenRepository<UserIDType>
		passwordResetTokenRepository?: IPasswordResetTokenRepository<UserIDType>
	}
) {
	const instance = State.initialize(
		passport,
		repositories.userRepository,
		repositories.refreshTokenRepository,
		repositories.invitationTokenRepository,
		repositories.passwordResetTokenRepository
	)

	instance.passport.use(PASSPORT_NAME.LOCAL, Login.strategy())
	instance.passport.use(PASSPORT_NAME.JWT_API, ApiAuth.strategy())
	instance.passport.use(PASSPORT_NAME.JWT_PASSWORD_RESET, PasswordReset.strategy())
	instance.passport.use(PASSPORT_NAME.JWT_INVITATION, Invitation.strategy())

	instance.passport.serializeUser((user, done) => done(null, user as Express.User))

	instance.passport.deserializeUser((user, done) => done(null, user as Express.User))
}

export {
	initAuth,
	ApiAuth,
	Login,
	Logout,
	LogoutEverywhere,
	PasswordReset,
	RefreshToken,
	Invitation,
	// enums
	PASSPORT_NAME,
	JWT_AUDIENCE,
	// helper functions
	createHash,
	// types
	IPassportConfig,
	IRefreshTokenRepository,
	IUserRepository,
	IInvitationTokenRepository,
	IPasswordResetTokenRepository,
	ID,
	IJwtPayload,
	IRefreshJwtPayload
}
