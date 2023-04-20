import ms from 'ms'

import { createJwt } from '../utils/jwt'
import { ID } from '../types/interfaces'
import { JWT_AUDIENCE } from '../utils/enums'
import { State } from '../State'

/**
 * returns invitation token for the user.
 * `saveInvitationToken` is called, if `invitationTokenRepository` was provided
 * @param userID
 */
export default async function getToken(userID: ID): Promise<string> {
	const tokenPayload = {
		uid: userID
	}

	const passportConfig = State.getInstance().config.passport
	const expiresIn = passportConfig.jwt.invitation.exp
	const tokenOptions = {
		audience: JWT_AUDIENCE.INVITATION,
		expiresIn
	}

	const token = await createJwt(tokenPayload, tokenOptions)

	await State.getInstance().invitationTokenRepository?.saveInvitationToken(userID, token, ms(expiresIn))

	return token
}
