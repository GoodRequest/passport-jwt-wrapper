import config from 'config'

import { createJwt } from '../utils/jwt'
import { ID } from '../types/interfaces'
import { IPassportConfig, LibConfig } from '../types/config'
import { JWT_AUDIENCE } from '../utils/enums'
import { State } from '../State'

const passportConfig: IPassportConfig = (<LibConfig>config.get('passportJwtWrapper')).passport

/**
 * returns invitation token for the user.
 * `saveInvitationToken` is called, if `invitationTokenRepository` was provided
 * @param userID
 */
export default async function getToken(userID: ID): Promise<string> {
	const tokenPayload = {
		uid: userID
	}

	const tokenOptions = {
		audience: JWT_AUDIENCE.INVITATION,
		expiresIn: passportConfig.jwt.invitation.exp
	}

	const token = await createJwt(tokenPayload, tokenOptions)
	await State.getInstance().invitationTokenRepository?.saveInvitationToken(userID, token)

	return token
}
