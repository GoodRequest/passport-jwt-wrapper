import config from 'config'
import { v4 as uuidv4 } from 'uuid'

import { IPassportConfig } from '../types/config'
import { JWT_AUDIENCE } from '../utils/enums'
import { State } from '../State'
import { createJwt } from '../utils/jwt'

const passportConfig: IPassportConfig = config.get('passport')

export default async (email: string): Promise<string | undefined> => {
	const state = State.getInstance()
	let user = await state.userRepository.getUserByEmail(email)

	let mock = false
	if (!user) {
		mock = true
		user = {
			id: uuidv4(),
			hash: uuidv4()
		}
	}

	const tokenPayload = {
		uid: user.id
	}

	const tokenOptions = {
		audience: JWT_AUDIENCE.PASSWORD_RESET,
		expiresIn: passportConfig.jwt.passwordReset.exp
	}

	const tokenSecret = mock ? user.hash : `${passportConfig.jwt.secretOrKey}${user.hash}`
	const resetPasswordToken = await createJwt(tokenPayload, tokenOptions, tokenSecret)

	if (mock) {
		return undefined
	}

	// save token when savePasswordResetToken repository is provided
	if (state.passwordResetTokenRepository) {
		await state.passwordResetTokenRepository.savePasswordResetToken(user.id, resetPasswordToken)
	}

	return resetPasswordToken
}
