import { sign, SignOptions } from 'jsonwebtoken'
import config from 'config'
import bcrypt from 'bcrypt'

import { IPassportConfig } from '../types/config'

const passportConfig: IPassportConfig = config.get('passport')

/**
 * Creates JWT token
 * @param {Object} payload Payload of JWT token
 * @param {SignOptions} options Options for signing JWT token
 * @param {string} [secret] Custom secret
 * @returns {Promise<string>} JWT token
 */
export function createJwt(payload: Object, options: SignOptions, secret?: string): Promise<string>
{
	return new Promise((resolve, reject) => {
		sign(payload, secret || passportConfig.jwt.secretOrKey, options, (err, token) => {
			if(err || !token) {
				return reject(err)
			}

			return resolve(token)
		})
	})
}

/**
 * Created hash fom provided value
 * @param {string} password value to hash
 * @returns {Promise<string>} hashed value
 */
export const createHash = async (password: string): Promise<string> => {
	const BCRYPT_WORK_FACTOR = 13
	const salt = await bcrypt.genSalt(BCRYPT_WORK_FACTOR)
	return await bcrypt.hash(password, salt)
}
