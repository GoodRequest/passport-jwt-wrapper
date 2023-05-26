import bcrypt from 'bcrypt'

import { ID } from '../types/interfaces'
import { State } from '../State'

export async function checkUserPassword(password: string, userID: ID) {
	const user = await State.getInstance().userRepository.getUserById(userID, true)
	if (!user || !user.hash) {
		return false
	}

	return bcrypt.compare(password, user.hash)
}

export async function checkPassword(password: string, hash: string) {
	return bcrypt.compare(password, hash)
}
