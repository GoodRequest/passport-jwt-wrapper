import config from 'config'

import jsonwebtoken from 'jsonwebtoken'
import { createJwt } from '../utils/jwt'
import { ID, IJwtPayload } from '../types/interfaces'
import { IPassportConfig } from '../types/config'
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

	const passportConfig: IPassportConfig = config.get('passportJwtWrapper.passport')
	const tokenOptions = {
		audience: JWT_AUDIENCE.INVITATION,
		expiresIn: passportConfig.jwt.invitation.exp
	}

	const token = await createJwt(tokenPayload, tokenOptions)

	const decoded = <IJwtPayload>jsonwebtoken.decode(token)

	await State.getInstance().invitationTokenRepository?.saveInvitationToken(userID, token, decoded.exp)

	return token
}
