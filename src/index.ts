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

function initAuth(
	passport: PassportStatic,
	repositories: {
		userRepository: IUserRepository<ID>
		refreshTokenRepository: IRefreshTokenRepository<ID, ID>
		invitationTokenRepository?: IInvitationTokenRepository<ID>
		passwordResetTokenRepository?: IPasswordResetTokenRepository<ID>
	}
) {
	passport.use(PASSPORT_NAME.LOCAL, Login.strategy())
	passport.use(PASSPORT_NAME.JWT_API, ApiAuth.strategy())
	passport.use(PASSPORT_NAME.JWT_PASSWORD_RESET, PasswordReset.strategy())
	passport.use(PASSPORT_NAME.JWT_INVITATION, Invitation.strategy())

	passport.serializeUser((user, done) => done(null, user as Express.User))

	passport.deserializeUser((user, done) => done(null, user as Express.User))

	State.passport = passport
	State.userRepository = repositories.userRepository
	State.refreshTokenRepository = repositories.refreshTokenRepository
	State.invitationTokenRepository = repositories.invitationTokenRepository
	State.passwordResetTokenRepository = repositories.passwordResetTokenRepository
}

export {
	initAuth,
	ApiAuth,
	Login,
	Logout,
	LogoutEverywhere,
	PasswordReset,
	RefreshToken,
	// enums
	PASSPORT_NAME,
	JWT_AUDIENCE,
	// types
	IPassportConfig,
	IRefreshTokenRepository,
	IUserRepository,
	ID,
	IJwtPayload,
	IRefreshJwtPayload
}

// TODO: test i18next scanner
