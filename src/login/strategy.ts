import { IVerifyOptions, VerifyFunction } from 'passport-local'
import bcrypt from 'bcrypt'
import config from 'config'
import { Strategy } from 'passport-local'

import { IPassportConfig } from '../types/config'
import { GetUserByEmailFunction } from '../types/interfaces'

const passportConfig: IPassportConfig = config.get('passport')

/**
 * Default local verify function
 * run function getUser and checks password against DB hash using bcrypt
 * @param getUserByEmail
 */
export function strategyVerifyFunction(getUserByEmail: GetUserByEmailFunction): VerifyFunction
{
	return async (email: string, password: string,
	        done: (error: any, userCallback?: any, options?: IVerifyOptions) => void) => {
		try
		{
			const user = await getUserByEmail(email)

			if(!user)
			{
				return done(null, false)
			}

			const passComp = await bcrypt.compare(password, user?.hash)
			if(!passComp)
			{
				return done(null, false)
			}

			return done(null, user)
		}
		catch(e)
		{
			return done(e)
		}
	}
}

export function strategy(getUser: GetUserByEmailFunction) {
	return new Strategy(passportConfig.local, strategyVerifyFunction(getUser))
}
