import { IVerifyOptions, Strategy } from 'passport-local'
import bcrypt from 'bcrypt'
import config from 'config'
import { Request } from 'express'

import { IPassportConfig, LibConfig } from '../types/config'
import { State } from '../State'

/**
 * Default local verify function
 * internally calls `userRepository.getUserByEmail` and if the user is returned, their password hash is checked using bcrypt compare method
 * @param req
 * @param email
 * @param password
 * @param done
 */
export async function strategyVerifyFunction(
	req: Request,
	email: string,
	password: string,
	done: (error: any, userCallback?: any, options?: IVerifyOptions) => void
) {
	try {
		const user = await State.getInstance().userRepository.getUserByEmail(email)

		if (!user) {
			return done(null, false)
		}

		if (!user.hash) {
			return done(null, false)
		}

		const passComp = await bcrypt.compare(password, user?.hash)
		if (!passComp) {
			return done(null, false)
		}

		return done(null, user)
	} catch (e) {
		return done(e)
	}
}

/**
 * passport-local Strategy
 */
export function strategy() {
	const passportConfig: IPassportConfig = (<LibConfig>config.get('passportJwtWrapper')).passport

	return new Strategy(passportConfig.local, strategyVerifyFunction)
}
