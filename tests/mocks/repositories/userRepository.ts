import { v4 as uuidv4 } from 'uuid'

import { createHash, IUserRepository } from '../../../src'

export interface IUser {
	id: string
	name?: string
	email: string
	hash?: string
}

interface IConfirmedUser extends IUser {
	hash: string
}

export class UserRepository implements IUserRepository<string> {
	private users = new Map<string, IUser>()

	getUserByEmail(email: string): Promise<IConfirmedUser | undefined> {
		let result: IConfirmedUser | undefined
		Array.from(this.users.values()).forEach((user) => {
			if (user.email === email && user.hash) {
				result = user as IConfirmedUser
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

	/**
	 * return user only if he has no password set -- is not registered
	 * @param userID
	 */
	getNewUserById(userID: string): Promise<IUser | undefined> {
		const user = this.users.get(userID)
		if (!user || user.hash) {
			return Promise.resolve(undefined)
		}

		return Promise.resolve(user)
	}

	/// Helper methods
	async add(email: string, password?: string): Promise<IUser> {
		const id = uuidv4()
		const hash = password ? await createHash(password) : undefined
		const user = {
			id,
			email,
			hash
		}

		this.users.set(id, user)

		return user
	}

	delete(userID: string): Promise<void> {
		this.users.delete(userID)

		return Promise.resolve()
	}

	invite(email: string): Promise<IUser> {
		const id = uuidv4()
		const user = {
			id,
			email
		}

		this.users.set(id, user)

		return Promise.resolve(user)
	}
}
