import config from 'config'

import { createJwt } from '../utils/jwt'
import { ID } from '../types/interfaces'
import { IPassportConfig } from '../types/config'
import { JWT_AUDIENCE } from '../utils/enums'
import { State } from '../State'

const passportConfig: IPassportConfig = config.get('passport')

export default async (userID: ID): Promise<string> => {
	const tokenPayload = {
		uid: userID
	}

	const tokenOptions = {
		audience: JWT_AUDIENCE.INVITATION,
		expiresIn: passportConfig.jwt.invitation.exp
	}

	const token = await createJwt(tokenPayload, tokenOptions)
	await State.invitationTokenRepository?.saveInvitationToken(userID, token)

	return token
}
