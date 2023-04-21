// Passport is not used in this library, but have to be provided by host application
// eslint-disable-next-line import/no-extraneous-dependencies
import { PassportStatic } from 'passport'
import { ExtractJwt } from 'passport-jwt'
import deepExtend from 'deep-extend'

import * as ApiAuth from './apiAuth'
import * as Login from './login'
import * as Logout from './logout'
import * as LogoutEverywhere from './logoutEverywhere'
import * as PasswordReset from './passwordReset'
import * as RefreshToken from './refreshToken'
import * as Invitation from './invitation'

import {
	ID,
	IInvitationTokenRepository,
	IJwtPayload,
	IPasswordResetTokenRepository,
	IRefreshJwtPayload,
	IRefreshTokenRepository,
	IUserRepository
} from './types/interfaces'
import { IPassportConfig, IPassportJwtWrapperConfig } from './types/config'
import { State } from './State'
import { JWT_AUDIENCE, PASSPORT_NAME } from './utils/enums'
import { createHash, createJwt } from './utils/jwt'
import defaultConfigs from '../config/default'
import { checkPassword, checkUserPassword } from './utils/helpers'

/**
 * Initialization method, have to be run before using this authentication library
 * repositories are: {
 * @param passport: PassportStatic instance
 * @param repositories {
 *	 	userRepository: IUserRepository<UserIDType> // required
 *		refreshTokenRepository: IRefreshTokenRepository<TokenIDType, UserIDType> // required
 *		invitationTokenRepository?: IInvitationTokenRepository<UserIDType> // optional -- need only when invitation cancellation will be implemented
 *		passwordResetTokenRepository?: IPasswordResetTokenRepository<UserIDType> // optional -- needed only when password reset tokens should be invalidated
 * }
 * @param config
 */
function initAuth<TokenIDType extends ID, UserIDType extends ID>(
	passport: PassportStatic,
	repositories: {
		userRepository: IUserRepository<UserIDType>
		refreshTokenRepository: IRefreshTokenRepository<TokenIDType, UserIDType>
		invitationTokenRepository?: IInvitationTokenRepository<UserIDType>
		passwordResetTokenRepository?: IPasswordResetTokenRepository<UserIDType>
	},
	config?: Partial<IPassportJwtWrapperConfig>
) {
	const instance = State.initialize(
		config ? deepExtend(defaultConfigs, config) : defaultConfigs,
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
	createJwt,
	checkPassword,
	checkUserPassword,
	// types
	IPassportJwtWrapperConfig,
	IPassportConfig,
	IRefreshTokenRepository,
	IUserRepository,
	IInvitationTokenRepository,
	IPasswordResetTokenRepository,
	ID,
	IJwtPayload,
	IRefreshJwtPayload,
	ExtractJwt
}
