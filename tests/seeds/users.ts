import { v4 as uuidv4 } from 'uuid'

import { IUser } from "../mocks/userRepository";

enum UserProperties {

}

enum LoginUserProps {

}

export interface ILoginUser {
	email: string
	password: string
}

class LoginUserStorage {
	private store = new Map<LoginUserProps, ILoginUser[]>()

	getUser(property?: LoginUserProps) {
		if(property) {
			return this.store.get(property)?.[0]
		}

		for(let key of this.store.keys()) {
			return this.store.get(key)?.[0]
		}

		return undefined
	}
}

class UserStorage {
	private store = new Map<UserProperties, IUser[]>()
}
