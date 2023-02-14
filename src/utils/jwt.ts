import jsonwebtoken, { sign, SignOptions } from 'jsonwebtoken'
import config from 'config'
import bcrypt from 'bcrypt'
import { Request } from 'express'

import { IPassportConfig, LibConfig } from '../types/config'
import { IRefreshJwtPayload } from '../types/interfaces'
import { JWT_AUDIENCE } from './enums'
import { ErrorBuilder } from './ErrorBuilder'
import { customTFunction } from './translations'

/**
 * Creates JWT token
 * @param {Object} payload Payload of JWT token
 * @param {SignOptions} options Options for signing JWT token
 * @param {string} [secret] Custom secret
 * @returns {Promise<string>} JWT token
 */
export function createJwt(payload: any, options: SignOptions, secret?: string): Promise<string> {
	const passportConfig: IPassportConfig = (<LibConfig>config.get('passportJwtWrapper')).passport

	return new Promise((resolve, reject) => {
		sign(payload, secret || passportConfig.jwt.secretOrKey, options, (err, token) => {
			if (err || !token) {
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
	return bcrypt.hash(password, salt)
}

/**
 * Decode jwt with secret from config and 'API_REFRESH' audience
 * @param token
 * @param req
 */
export function decodeRefreshJwt(token: string, req: Request): Promise<IRefreshJwtPayload> {
	const passportConfig: IPassportConfig = (<LibConfig>config.get('passportJwtWrapper')).passport

	return new Promise((resolve, reject) => {
		jsonwebtoken.verify(
			token,
			passportConfig.jwt.secretOrKey,
			{
				audience: JWT_AUDIENCE.API_REFRESH
			},
			(err, decoded: any) => {
				if (err) {
					const t = req.t ?? customTFunction
					return reject(new ErrorBuilder(401, t('error:Refresh token is not valid')))
				}

				return resolve(decoded)
			}
		)
	})
}
