import { Strategy as JwtStrategy, VerifiedCallback } from 'passport-jwt'
import config from 'config'
import { Request } from 'express'

import { ErrorBuilder } from '../utils/ErrorBuilder'
import { IPassportConfig } from '../types/config'
import { IJwtPayload } from '../types/interfaces'
import { State } from '../State'

const passportConfig: IPassportConfig = config.get('passport')

export async function strategyVerifyFunction(req: Request, payload: IJwtPayload, done: VerifiedCallback) {
	try {
		const user = await State.userRepository.getUserById(`${payload.uid}`)

		if(!user) {
			const message = 'error:User was not found'
			throw new ErrorBuilder(401, req.t ? req.t(message) : message)
		}

		return done(null, user)
	} catch(e) {
		return done(e)
	}
}

export function strategy() {
	return new JwtStrategy({
		...passportConfig.jwt.api,
		secretOrKey: passportConfig.jwt.secretOrKey,
	}, strategyVerifyFunction)
}
