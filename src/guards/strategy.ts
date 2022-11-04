import { Strategy as JwtStrategy, VerifiedCallback } from 'passport-jwt'
import { IPassportConfig } from '../types/config'
import config from 'config'
import { Request } from 'express'
import { ErrorBuilder } from '../utils/ErrorBuilder'
import { GetUserByIdFunction, ID, IJwtPayload } from '../types/interfaces'

const passportConfig: IPassportConfig = config.get('passport')

export function strategyVerifyFunction(getUser: GetUserByIdFunction<ID>) {
	return async (req: Request, payload: IJwtPayload, done: VerifiedCallback) => {
		try {
			const user = getUser(`${payload.uid}`)

			if(!user) {
				const message = 'error:User was not found'
				throw new ErrorBuilder(401, req.t ? req.t(message) : message)
			}

			return done(null, user)
		} catch(e) {
			return done(e)
		}
	}
}

export function strategy(getUser: GetUserByIdFunction<ID>) {
	return new JwtStrategy({
		...passportConfig.jwt.api,
		secretOrKey: passportConfig.jwt.secretOrKey,
	}, strategyVerifyFunction(getUser))
}
