import config from 'config'

import { IPassportConfig } from '../types/config'
import { JWT_AUDIENCE } from '../utils/enums'
import { State } from '../State'
import { createJwt } from '../utils/jwt'

const passportConfig: IPassportConfig = config.get('passport')

/**
 * return 10 "random" characters
 */
function getRandomChars(): string {
	return Math.random().toString(36).substring(2, 10) // just 10 chars
}

function getRandomString(length: number): string {
	let result = getRandomChars()
	while (result.length < length) {
		result = `${result}${getRandomChars()}`
	}

	if (result.length > length) {
		result = result.substring(0, length)
	}

	return result
}

export default async (email: string): Promise<string | undefined> => {
	const state = State.getInstance()
	let user = await state.userRepository.getUserByEmail(email)

	let passportSecret = passportConfig.jwt.secretOrKey

	const randomString = getRandomString(60 + passportSecret.length)

	let mock = false
	if (!user) {
		mock = true
		user = {
			id: randomString.substring(0, 36),
			hash: randomString.substring(0, 60)
		}

		passportSecret = randomString
	}

	const tokenPayload = {
		uid: user.id
	}

	const tokenOptions = {
		audience: JWT_AUDIENCE.PASSWORD_RESET,
		expiresIn: passportConfig.jwt.passwordReset.exp
	}

	const tokenSecret = `${passportSecret}${user.hash}`
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

export async function getTokenOld(email: string): Promise<undefined | string> {
	const state = State.getInstance()
	const user = await state.userRepository.getUserByEmail(email)

	if (!user) {
		return undefined
	}

	const tokenPayload = {
		uid: user.id
	}

	const tokenOptions = {
		audience: JWT_AUDIENCE.PASSWORD_RESET,
		expiresIn: passportConfig.jwt.passwordReset.exp
	}

	const tokenSecret = `${passportConfig.jwt.secretOrKey}${user.hash}`
	const resetPasswordToken = await createJwt(tokenPayload, tokenOptions, tokenSecret)

	// save token when savePasswordResetToken repository is provided
	if (state.passwordResetTokenRepository) {
		await state.passwordResetTokenRepository.savePasswordResetToken(user.id, resetPasswordToken)
	}

	return resetPasswordToken
}
