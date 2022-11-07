import { createHash } from '../utils/jwt'
import { State } from '../State'
import { ID } from '../types/interfaces'

export default async function workflow(password: string, userID: ID): Promise<void> {
	const hash = await createHash(password)

	await State.userRepository.updateUserPassword(userID, hash)

	await State.refreshTokenRepository.invalidateUserRefreshTokens?.(userID)
}
