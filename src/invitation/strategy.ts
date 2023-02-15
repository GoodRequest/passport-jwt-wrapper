import { Strategy as JwtStrategy, VerifiedCallback } from 'passport-jwt'
import config from 'config'

import { Request } from 'express'
import { IPassportConfig } from '../types/config'
import { IJwtPayload } from '../types/interfaces'
import { State } from '../State'
import { ErrorBuilder } from '../utils/ErrorBuilder'
import { customTFunction } from '../utils/translations'
import { JWT_AUDIENCE } from '../utils/enums'

/**
 * Strategy verify function for invitation. Validates invitation token.
 * Internally calls `invitationTokenRepository.isInvitationTokenValid` if `invitationTokenRepository` is provided.
 * Also calls `userRepository.getNewUserById` (if provided) or `userRepository.getUserById` if not.
 * @param req
 * @param payload
 * @param done
 */
export const strategyVerifyFunction = async (req: Request, payload: IJwtPayload, done: VerifiedCallback) => {
	try {
		const state = State.getInstance()
		const userRepo = state.userRepository
		const getUser = userRepo.getNewUserById ?? userRepo.getUserById

		const t = req.t ?? customTFunction
		let isTokenValid = true
		if (state.invitationTokenRepository) {
			isTokenValid = await state.invitationTokenRepository.isInvitationTokenValid(payload.uid)
		}

		if (!isTokenValid) {
			throw new ErrorBuilder(401, t('error:Invitation token is not valid'))
		}

		// without the bind, this (userRepo) is lost in the context
		const user = await getUser.bind(userRepo)(payload.uid)

		if (!user) {
			throw new ErrorBuilder(401, t('error:User was not found'))
		}

		return done(null, user)
	} catch (e) {
		return done(e)
	}
}

/**
 * User invitation strategy, needed for the guard to function.
 */
export function strategy() {
	const passportConfig: IPassportConfig = config.get('passportJwtWrapper.passport')

	return new JwtStrategy(
		{
			...passportConfig.jwt.invitation,
			audience: JWT_AUDIENCE.INVITATION,
			passReqToCallback: true,
			secretOrKey: passportConfig.jwt.secretOrKey
		},
		strategyVerifyFunction
	)
}
