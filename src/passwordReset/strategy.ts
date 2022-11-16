import { Strategy as JwtStrategy, VerifiedCallback } from 'passport-jwt'
import config from 'config'
import { Request } from 'express'
import jsonwebtoken from 'jsonwebtoken'

import { IJwtPayload } from '../types/interfaces'
import { IPassportConfig } from '../types/config'
import { State } from '../State'
import { ErrorBuilder } from '../utils/ErrorBuilder'

const passportConfig: IPassportConfig = config.get('passport')

/**
 * get custom secret (hash + secret) for forgot-password token
 * @param req
 * @param rawJwtToken
 * @param done
 */
export async function secretOrKeyProvider(req: Request, rawJwtToken: string, done: (err: any, secretOrKey?: string | Buffer) => void): Promise<void> {
	try {
		const decodedToken: any = jsonwebtoken.decode(rawJwtToken)

		const user = await State.getInstance().userRepository.getUserById(decodedToken.uid)

		if (!user) {
			return done(null)
		}

		const userSecret = `${passportConfig.jwt.secretOrKey}${user.hash}`
		return done(null, userSecret)
	} catch (err) {
		return done(err)
	}
}

export async function strategyVerifyFunction(payload: IJwtPayload, done: VerifiedCallback) {
	try {
		const state = State.getInstance()
		const user = await state.userRepository.getUserById(payload.uid)
		if (state.passwordResetTokenRepository) {
			const isTokenValid = await state.passwordResetTokenRepository.isPasswordTokenValid(payload.uid)
			if (!isTokenValid) {
				// TODO: i18next
				throw new ErrorBuilder(401, 'error:Password reset was cancelled')
			}
		}

		if (!user) {
			// TODO: i18next
			throw new ErrorBuilder(401, 'error:User was not found')
		}

		return done(null, user)
	} catch (err) {
		return done(err)
	}
}

export function strategy() {
	return new JwtStrategy(
		{
			...passportConfig.jwt.passwordReset,
			secretOrKeyProvider
		},
		strategyVerifyFunction
	)
}
