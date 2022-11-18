import { v4 as uuidv4 } from 'uuid'

import { createHash, IUserRepository } from '../../src'

export interface IUser {
	id: string
	name?: string
	email: string
	hash?: string
}

export class UserRepository implements IUserRepository<string> {
	private users = new Map<string, IUser>()

	getUserByEmail(email: string): Promise<IUser | undefined> {
		let result: IUser | undefined
		Array.from(this.users.values()).forEach((user) => {
			if (user.email === email) {
				result = user
			}
		})

		return Promise.resolve(result)
	}

	getUserById(id: string): Promise<IUser | undefined> {
		return Promise.resolve(this.users.get(id))
	}

	updateUserPassword(userID: string, newPassword: string): Promise<void> {
		const user = this.users.get(userID)
		if (user) {
			user.hash = newPassword
		}

		return Promise.resolve()
	}

	async add(email: string, password?: string): Promise<void> {
		const id = uuidv4()
		const hash = password ? await createHash(password) : undefined
		this.users.set(id, {
			id,
			email,
			hash
		})
	}
}
