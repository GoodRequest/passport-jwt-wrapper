import { Strategy as JwtStrategy, VerifiedCallback } from 'passport-jwt'
import { IPassportConfig } from '../types/config'
import config from 'config'
import { Request } from 'express'
import { ErrorBuilder } from '../utils/ErrorBuilder'
import { GetUserByIdFunction, ID, IJwtPayload } from '../types/interfaces'
import jsonwebtoken from 'jsonwebtoken'
import { State } from '../State'

const passportConfig: IPassportConfig = config.get('passport')

export function jwtVerifyUserApi(getUser: GetUserByIdFunction<ID>) {
	return async (req: Request, payload: IJwtPayload, done: VerifiedCallback) => {
		try {
			const user = getUser(`${payload.uid}`)

			if(!user) {
				const message = 'error:User was not found'
				throw new ErrorBuilder(401, req.t ? req.t(message) : message)
			}

			return done(null, user)
		} catch(e) {
			return done(e)
		}
	}
}

export function defaultJWTStrategy(getUser: GetUserByIdFunction<ID>) {
	return new JwtStrategy({
		...passportConfig.jwt.api,
		secretOrKey: passportConfig.jwt.secretOrKey,
	}, jwtVerifyUserApi(getUser))
}

// get custom secret (hash + secret) for forgot-password token
export async function secretOrKeyProvider(req: Request, rawJwtToken: string, done: (err: any, secretOrKey?: string | Buffer) => void): Promise<void> {
	try {
		const decodedToken: any = jsonwebtoken.decode(rawJwtToken)

		const user = await State.userRepository.getUserById(decodedToken.uid)

		if (!user) {
			return done(null)
		}

		const userSecret = `${passportConfig.jwt.secretOrKey}${user.hash}`
		return done(null, userSecret)
	} catch (err) {
		return done(err)
	}
}


export async function jwtVerifyPasswordReset(payload: IJwtPayload, done: VerifiedCallback) {
	try {
		const user = await State.userRepository.getUserById(payload.uid)
		if(State.userTokenRepository.isPasswordTokenValid) {
			const isTokenValid = await State.userTokenRepository.isPasswordTokenValid?.(payload.uid)
			if(!isTokenValid) {
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

export function resetPasswordJWTStrategy() {
	return new JwtStrategy({
		...passportConfig.jwt.passwordReset,
		secretOrKeyProvider
	}, jwtVerifyPasswordReset)
}
