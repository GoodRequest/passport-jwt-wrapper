import jsonwebtoken, { sign, SignOptions } from 'jsonwebtoken'
import bcrypt from 'bcrypt'

import { TFunction } from 'i18next'
import { IRefreshJwtPayload } from '../types/interfaces'
import { JWT_AUDIENCE } from './enums'
import { ErrorBuilder } from './ErrorBuilder'
import { customTFunction } from './translations'
import { Flow } from './Flow'
import { State } from '../State'

/**
 * Creates JWT token
 * @param {Object} payload Payload of JWT token
 * @param {SignOptions} options Options for signing JWT token
 * @param {string} [secret] Custom secret
 * @returns {Promise<string>} JWT token
 */
export function createJwt(payload: any, options: SignOptions, secret?: string): Promise<string> {
	const passportConfig = State.getInstance().config.passport

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
 * Decodes and verifies jwt with secret from config and 'API_REFRESH' audience
 * @param token
 * @param tFunction
 */
export function verifyRefreshJWT(token: string, tFunction?: TFunction): Promise<IRefreshJwtPayload> {
	const passportConfig = State.getInstance().config.passport

	return new Promise((resolve, reject) => {
		jsonwebtoken.verify(
			token,
			passportConfig.jwt.secretOrKey,
			{
				audience: JWT_AUDIENCE.API_REFRESH
			},
			(err, decoded: any) => {
				if (err) {
					let t: TFunction
					if (tFunction) {
						t = tFunction
					} else {
						const flowData = Flow.get()
						t = flowData.t ?? (customTFunction as TFunction)
					}
					return reject(new ErrorBuilder(401, t('error:Refresh token is not valid')))
				}

				return resolve(decoded)
			}
		)
	})
}
