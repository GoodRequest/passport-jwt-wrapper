import { PassportStatic } from 'passport'

import { getLoginTokens } from './functions/getLoginTokens'
import { LoginMiddleware } from './middlewares/loginMiddleware'
import { defaultLocalStrategy, defaultLocalVerify } from './strategy/localStrategy'
import { defaultJWTStrategy, resetPasswordJWTStrategy } from './strategy/JWTStrategy'
import { ID, IJwtPayload, IRefreshJwtPayload, IUserRepository, IUserTokenRepository } from './types/interfaces'
import { IPassportConfig } from './types/config'
import { State } from './State'
import { PASSPORT_NAME } from './utils/enums'
import { AuthGuard } from './middlewares/AuthGuard'
import { refreshTokenEndpoint } from './endpoints/refreshTokenEndpoint'
import { getPasswordResetToken } from './functions/getPasswordResetToken'
import { resetPasswordMiddleware } from './middlewares/resetPasswordMiddleware'
import { resetPasswordEndpoint } from './endpoints/resetPasswordEndpoint'

function initAuth(passport: PassportStatic, userRepository: IUserRepository<ID>, userTokenRepository: IUserTokenRepository<ID>) {
	passport.use(PASSPORT_NAME.LOCAL, defaultLocalStrategy(userRepository.getUserByEmail))

	passport.use(PASSPORT_NAME.JWT_API, defaultJWTStrategy(userRepository.getUserById))

	passport.use(PASSPORT_NAME.JWT_PASSWORD_RESET, resetPasswordJWTStrategy())
	// passport.use('jwt-invitation', new JwtStrategy({ ...passportConfig.jwt.invitation, secretOrKey: passportConfig.jwt.secretOrKey }, jwtVerifyInvitation))

	passport.serializeUser((user, done) => done(null, user as Express.User))

	passport.deserializeUser((user, done) => done(null, user as Express.User))
	State.passport = passport
	State.userRepository = userRepository
	State.userTokenRepository = userTokenRepository
}

export {
	// init
	initAuth,
	// JWT strategies
	defaultLocalVerify,
	defaultLocalStrategy,
	resetPasswordJWTStrategy,
	// functions
	getLoginTokens,
	getPasswordResetToken,
	// middlewares
	LoginMiddleware,
	resetPasswordMiddleware,
	AuthGuard,
	//endpoints
	refreshTokenEndpoint,
	resetPasswordEndpoint,
	// types
	IPassportConfig,
	IUserTokenRepository,
	IUserRepository,
	ID,
	IJwtPayload,
	IRefreshJwtPayload
}


// TODO: test i18next scanner
