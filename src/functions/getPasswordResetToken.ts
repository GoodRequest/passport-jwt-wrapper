import config from 'config'

import { IPassportConfig } from '../types/config'
import { JWT_AUDIENCE } from '../utils/enums'
import { State } from '../State'
import { createJwt } from '../utils/jwt'

const passportConfig: IPassportConfig = config.get('passport')

export async function getPasswordResetToken(email: string): Promise<string | null> {
	const user = await State.userRepository.getUserByEmail(email)

	let forgottenPasswordToken: string | null = null
	if(user) {
	const tokenPayload = {
		uid: user.id
	}

	const tokenOptions = {
		audience: JWT_AUDIENCE.PASSWORD_RESET,
		expiresIn: passportConfig.jwt.passwordReset.exp
	}

	const tokenSecret = `${passportConfig.jwt.secretOrKey}${user.hash}`
	forgottenPasswordToken = await createJwt(tokenPayload, tokenOptions, tokenSecret)
	}

	return forgottenPasswordToken
}
