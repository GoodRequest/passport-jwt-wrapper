import { v4 as uuidv4 } from 'uuid'

import { IUserRepository } from "../../src";

export interface IUser {
	id: string
	name?: string
	email: string
	hash?: string
}

export class UserRepository implements IUserRepository<string>
{
	private users = new Map<string, IUser>()

	getUserByEmail(email: string): Promise<IUser | undefined>
	{
		for(let user of this.users.values()) {
			if(user.email === email) {
				return Promise.resolve(user)
			}
		}

		return Promise.resolve(undefined)
	}

	getUserById(id: string): Promise<IUser | undefined>
	{
		return Promise.resolve(this.users.get(id))
	}

	updateUserPassword(userID: string, newPassword: string): Promise<void>
	{

		const user = this.users.get(userID)
		if(user) {
			user.hash = newPassword;
		}

		return Promise.resolve()
	}

	add(email: string, password?: string): void {
		const id = uuidv4()
		this.users.set(id, {
			id,
			email,
			// just for testing -> !!! HASH PASSWORDS IN PRODUCTION !!!
			hash: password
		})
	}
}
