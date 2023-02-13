// Passport is not used in this library, but have to be provided by host application
// eslint-disable-next-line import/no-extraneous-dependencies
import { PassportStatic } from 'passport'
import { ExtractJwt } from 'passport-jwt'
import { InitOptions } from 'i18next'
/* eslint-disable import/first */
process.env.SUPPRESS_NO_CONFIG_WARNING = 'y'
import config from 'config'

const i18nextConfig = <InitOptions>{
	preload: ['en', 'sk'],
	fallbackLng: 'en',
	ns: ['error', 'translation'],
	defaultNS: 'translation',
	detection: {
		order: ['header']
	},
	backend: {
		loadPath: 'locales/{{lng}}/{{ns}}.json',
		jsonIndent: 2
	},
	nsSeparator: ':',
	keySeparator: false
}

const passportConfig = <IPassportConfig>{
	local: {
		usernameField: 'email',
		passwordField: 'password',
		session: false,
		passReqToCallback: true
	},
	jwt: {
		secretOrKey: process.env.JWT_SECRET,
		api: {
			exp: '15m',
			jwtFromRequest: ExtractJwt.fromExtractors([ExtractJwt.fromAuthHeaderAsBearerToken(), ExtractJwt.fromUrlQueryParameter('t')]),
			refresh: {
				exp: '4h'
			}
		},
		passwordReset: {
			exp: '4h',
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
		},
		invitation: {
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			exp: '30d'
		}
	}
}

const defaultConfigs: LibConfig = {
	i18next: i18nextConfig,
	passport: passportConfig
}

config.util.setModuleDefaults('i18next', defaultConfigs.i18next)
config.util.setModuleDefaults('passport', defaultConfigs.passport)

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
import { IPassportConfig, LibConfig } from './types/config'
import { State } from './State'
import { JWT_AUDIENCE, PASSPORT_NAME } from './utils/enums'
import { createHash } from './utils/jwt'

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
 */
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
	IRefreshJwtPayload,
	ExtractJwt
}
