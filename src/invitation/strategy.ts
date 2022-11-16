import { Strategy as JwtStrategy, VerifiedCallback } from 'passport-jwt'
import config from 'config'

import { Request } from 'express'
import { IPassportConfig } from '../types/config'
import { IJwtPayload } from '../types/interfaces'
import { State } from '../State'
import { ErrorBuilder } from '../utils/ErrorBuilder'
import { getTFunction } from '../utils/helpers'

const passportConfig: IPassportConfig = config.get('passport')

export const strategyVerifyFunction = async (req: Request, payload: IJwtPayload, done: VerifiedCallback) => {
	try {
		const state = State.getInstance()
		let getUser = state.userRepository.getUserById
		if (state.userRepository.getNewUserById) {
			getUser = state.userRepository.getNewUserById
		}

		const user = await getUser(payload.uid)

		const t = getTFunction(req)

		if (!user) {
			throw new ErrorBuilder(401, t('error:User was not found'))
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
			secretOrKey: passportConfig.jwt.secretOrKey
		},
		strategyVerifyFunction
	)
}
