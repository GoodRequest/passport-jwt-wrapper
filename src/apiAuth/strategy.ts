import { Strategy as JwtStrategy, VerifiedCallback } from 'passport-jwt'
import config from 'config'
import { Request } from 'express'

import { IPassportConfig } from '../types/config'
import { IJwtPayload } from '../types/interfaces'
import { State } from '../State'
import { JWT_AUDIENCE } from '../utils/enums'

const passportConfig: IPassportConfig = config.get('passport')

export async function strategyVerifyFunction(req: Request, payload: IJwtPayload, done: VerifiedCallback) {
	try {
		const user = await State.userRepository.getUserById(`${payload.uid}`)

		if (!user) {
			throw new Error('User was not found')
		}

		return done(null, user)
	} catch (e) {
		console.log('catch error', e)
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
