import { Strategy as JwtStrategy, VerifiedCallback } from 'passport-jwt'
import config from 'config'
import { Request } from 'express'
import jsonwebtoken from 'jsonwebtoken'

import { IJwtPayload } from '../types/interfaces'
import { IPassportConfig } from '../types/config'
import { State } from '../State'
import { ErrorBuilder } from '../utils/ErrorBuilder'
import { customTFunction } from '../utils/translations'

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

/**
 * Verify function for password reset.
 * It's main objective is to fetch user from repository by calling `userRepository.getUserByID` and validating password reset token
 * by calling `passwordResetTokenRepository.isPasswordTokenValid` if the repository is provided.
 * @param req
 * @param payload
 * @param done
 */
export async function strategyVerifyFunction(req: Request, payload: IJwtPayload, done: VerifiedCallback) {
	try {
		const state = State.getInstance()
		const user = await state.userRepository.getUserById(payload.uid)

		const t = req.t ?? customTFunction

		if (state.passwordResetTokenRepository) {
			const isTokenValid = await state.passwordResetTokenRepository.isPasswordTokenValid(payload.uid)
			if (!isTokenValid) {
				throw new ErrorBuilder(401, t('error:Password reset token is invalid'))
			}
		}

		if (!user) {
			throw new ErrorBuilder(401, t('error:User was not found'))
		}

		return done(null, user)
	} catch (err) {
		return done(err)
	}
}

/**
 * Password reset strategy
 */
export function strategy() {
	return new JwtStrategy(
		{
			...passportConfig.jwt.passwordReset,
			passReqToCallback: true,
			secretOrKeyProvider
		},
		strategyVerifyFunction
	)
}
