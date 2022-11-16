import config from 'config'

import { IPassportConfig } from '../types/config'
import { JWT_AUDIENCE } from '../utils/enums'
import { State } from '../State'
import { createJwt } from '../utils/jwt'

const passportConfig: IPassportConfig = config.get('passport')

export default async (email: string): Promise<string | null> => {
	const state = State.getInstance()
	const user = await state.userRepository.getUserByEmail(email)

	let resetPasswordToken: string | null = null
	if (user) {
		const tokenPayload = {
			uid: user.id
		}

		const tokenOptions = {
			audience: JWT_AUDIENCE.PASSWORD_RESET,
			expiresIn: passportConfig.jwt.passwordReset.exp
		}

		const tokenSecret = `${passportConfig.jwt.secretOrKey}${user.hash}`
		resetPasswordToken = await createJwt(tokenPayload, tokenOptions, tokenSecret)

		// save token when savePasswordResetToken function is provided
		if (state.passwordResetTokenRepository) {
			await state.passwordResetTokenRepository.savePasswordResetToken(user.id, resetPasswordToken)
		}
	}

	return resetPasswordToken
}
