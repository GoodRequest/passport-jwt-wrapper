import config from 'config'

import { createJwt } from '../utils/jwt'
import { ID } from '../types/interfaces'
import { IPassportConfig } from '../types/config'
import { JWT_AUDIENCE } from '../utils/enums'

const passportConfig: IPassportConfig = config.get('passport')

export function getToken(userID: ID): Promise<string> {
	const tokenPayload = {
		uid: userID
	}

	const tokenOptions = {
		audience: JWT_AUDIENCE.INVITATION,
		expiresIn: passportConfig.jwt.invitation.exp
	}

	return createJwt(tokenPayload, tokenOptions)
}
