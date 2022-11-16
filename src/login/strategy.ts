import { IVerifyOptions, Strategy } from 'passport-local'
import bcrypt from 'bcrypt'
import config from 'config'
import { Request } from 'express'

import { IPassportConfig } from '../types/config'
import { State } from '../State'

const passportConfig: IPassportConfig = config.get('passport')

/**
 * Default local verify function
 * run function getUser and checks password against DB hash using bcrypt
 * @param req
 * @param email
 * @param password
 * @param done
 */
export async function strategyVerifyFunction(req: Request, email: string, password: string, done: (error: any, userCallback?: any, options?: IVerifyOptions) => void) {
	try {
		const user = await State.getInstance().userRepository.getUserByEmail(email)

		if (!user) {
			return done(null, false)
		}

		if(!user.hash) {
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

export function strategy() {
	return new Strategy(passportConfig.local, strategyVerifyFunction)
}
