import { createHash } from '../utils/jwt'
import { State } from '../State'
import { ID } from '../types/interfaces'

/**
 * Workflow method used in the `PasswordReset.endpoint`.
 * Internally hashes user new password and subsequently call `userRepository.updateUserPassword` with this hash.
 * It also invalidates all user refresh tokens, if `userRepository.invalidateUserRefreshTokens` method is provided.
 * @param password
 * @param userID
 */
export default async function runner(password: string, userID: ID): Promise<void> {
	const hash = await createHash(password)

	const state = State.getInstance()
	await state.userRepository.updateUserPassword(userID, hash)

	await state.refreshTokenRepository.invalidateUserRefreshTokens?.(userID)
}
