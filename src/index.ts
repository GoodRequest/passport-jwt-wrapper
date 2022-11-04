import { PassportStatic } from 'passport'

import * as Guards from './guards';
import * as Login from './login';
import * as PasswordReset from './passwordReset';
import * as RefreshToken from './refreshToken';

import { ID, IJwtPayload, IRefreshJwtPayload, IUserRepository, IUserTokenRepository } from './types/interfaces'
import { IPassportConfig } from './types/config'
import { State } from './State'
import { JWT_AUDIENCE, PASSPORT_NAME } from './utils/enums'

function initAuth(passport: PassportStatic, userRepository: IUserRepository<ID>, userTokenRepository: IUserTokenRepository<ID, ID>) {
	passport.use(PASSPORT_NAME.LOCAL, Login.strategy(userRepository.getUserByEmail))

	passport.use(PASSPORT_NAME.JWT_API, Guards.strategy(userRepository.getUserById))

	passport.use(PASSPORT_NAME.JWT_PASSWORD_RESET, PasswordReset.strategy())
	// passport.use('jwt-invitation', new JwtStrategy({ ...passportConfig.jwt.invitation, secretOrKey: passportConfig.jwt.secretOrKey }, jwtVerifyInvitation))

	passport.serializeUser((user, done) => done(null, user as Express.User))

	passport.deserializeUser((user, done) => done(null, user as Express.User))

	State.passport = passport
	State.userRepository = userRepository
	State.userTokenRepository = userTokenRepository
}

export {
	initAuth,
	Guards,
	Login,
	PasswordReset,
	RefreshToken,
	// enums
	PASSPORT_NAME,
	JWT_AUDIENCE,
	// types
	IPassportConfig,
	IUserTokenRepository,
	IUserRepository,
	ID,
	IJwtPayload,
	IRefreshJwtPayload
};

// TODO: test i18next scanner
