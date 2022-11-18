import { Strategy as JwtStrategy, VerifiedCallback } from 'passport-jwt'
import config from 'config'
import { Request } from 'express'

import { IPassportConfig } from '../types/config'
import { IJwtPayload } from '../types/interfaces'
import { State } from '../State'
import { JWT_AUDIENCE } from '../utils/enums'
import { ErrorBuilder } from '../utils/ErrorBuilder'
import { customTFunction } from '../utils/helpers'

const passportConfig: IPassportConfig = config.get('passport')

export async function strategyVerifyFunction(req: Request, payload: IJwtPayload, done: VerifiedCallback) {
	try {
		const user = await State.getInstance().userRepository.getUserById(`${payload.uid}`)

		if (!user) {
			throw new ErrorBuilder(401, customTFunction(req, 'error:User was not found'))
		}

		return done(null, user)
	} catch (e) {
		return done(e)
	}
}

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
