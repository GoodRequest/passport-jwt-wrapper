import { Strategy as JwtStrategy, VerifiedCallback } from 'passport-jwt'
import config from 'config'
import { Request } from 'express'

import { IPassportConfig, LibConfig } from '../types/config'
import { IJwtPayload } from '../types/interfaces'
import { State } from '../State'
import { JWT_AUDIENCE } from '../utils/enums'
import { ErrorBuilder } from '../utils/ErrorBuilder'
import { customTFunction } from '../utils/translations'

const passportConfig: IPassportConfig = (<LibConfig>config.get('passportJwtWrapper')).passport

/**
 * Internally calls `userRepository.getUserById` with userID (uid) from decoded access JWT
 * @param req
 * @param payload
 * @param done
 */
export async function strategyVerifyFunction(req: Request, payload: IJwtPayload, done: VerifiedCallback) {
	try {
		const user = await State.getInstance().userRepository.getUserById(`${payload.uid}`)

		if (!user) {
			const t = req.t ?? customTFunction
			throw new ErrorBuilder(401, t('error:User was not found'))
		}

		return done(null, user)
	} catch (e) {
		return done(e)
	}
}

/**
 * passport-jwt strategy for securing endpoints with access JWTs
 */
export function strategy() {
	return new JwtStrategy(
		{
			...passportConfig.jwt.api,
			audience: JWT_AUDIENCE.API_ACCESS,
			passReqToCallback: true,
			secretOrKey: passportConfig.jwt.secretOrKey
		},
		strategyVerifyFunction
	)
}
