import { Strategy as JwtStrategy, VerifiedCallback } from 'passport-jwt'
import config from 'config'

import { IPassportConfig } from '../types/config'
import { Request } from 'express'
import { IJwtPayload } from '../types/interfaces'
import { State } from '../State'
import { ErrorBuilder } from '../utils/ErrorBuilder'

const passportConfig: IPassportConfig = config.get('passport')

export const strategyVerifyFunction = async (req: Request, payload: IJwtPayload, done: VerifiedCallback) => {
	try {
		let getUser = State.userRepository.getUserById
		if(State.userRepository.getNewUserById) {
			getUser = State.userRepository.getNewUserById
		}

		const user = await getUser(payload.uid)

		if (!user) {
			throw new ErrorBuilder(401, req.t('error:User was not found'))
		}

		return done(null, user)
	} catch (e) {
		return done(e)
	}
}

export function strategy() {
	return new JwtStrategy({
		...passportConfig.jwt.api,
		secretOrKey: passportConfig.jwt.secretOrKey,
	}, strategyVerifyFunction)
}
