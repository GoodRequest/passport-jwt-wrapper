import { Strategy as JwtStrategy, VerifiedCallback } from 'passport-jwt'
import { Request } from 'express'

import { IJwtPayload } from '../types/interfaces'
import { State } from '../State'
import { JWT_AUDIENCE } from '../utils/enums'
import { ErrorBuilder } from '../utils/ErrorBuilder'
import { customTFunction } from '../utils/translations'

/**
 * Internally calls `userRepository.getUserById` with userID (uid) from decoded access JWT
 * @param req
 * @param payload
 * @param done
 */
export async function strategyVerifyFunction(req: Request, payload: IJwtPayload, done: VerifiedCallback) {
	const libConfig = State.getInstance().config

	try {
		const user = await State.getInstance().userRepository.getUserById(payload.uid, false)

		const t = req.t ?? customTFunction
		if (!user) {
			throw new ErrorBuilder(401, t('error:User was not found'))
		}

		if (libConfig.checkAccessToken) {
			const isTokenValid = await State.getInstance().refreshTokenRepository.isRefreshTokenValid(payload.uid, payload.fid, payload.rid)
			if (!isTokenValid) {
				// User is not logged in
				throw new ErrorBuilder(401, t('error:Access token is not valid'))
			}
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
	const passportConfig = State.getInstance().config.passport

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
