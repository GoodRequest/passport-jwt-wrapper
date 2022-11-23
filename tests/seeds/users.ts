import { DomainSet, DomainStorage } from '../domain'

const emails = {
	test: 'test@goodrequest.com',
	nonExisting: 'nonExisting@goodrequest.com',
	wrongFormat: 'wrongFormat.com'
}

const passwords = {
	test: 'password1234.',
	testWrong: 'wrongPass456'
}

export enum LoginUserProperty {}

export class LoginUser implements DomainSet<LoginUserProperty> {
	private ID?: string
	email: string
	password?: string
	properties: LoginUserProperty[]
	private accessToken?: string
	private refreshToken?: string
	isValid: boolean
	isPositive: boolean

	constructor(email: string, password: string | undefined, properties: LoginUserProperty[] | undefined, isValid: boolean, isPositive?: boolean) {
		this.email = email
		this.password = password
		this.properties = properties ?? []
		this.isValid = isValid
		this.isPositive = isPositive ?? false
	}

	setTokens(accessToken: string, refreshToken: string) {
		this.accessToken = accessToken
		this.refreshToken = refreshToken
	}

	get at(): string {
		if (!this.accessToken) {
			throw new Error(`User have no accessToken set: ${this}`)
		}

		return this.accessToken
	}

	get rt(): string {
		if (!this.refreshToken) {
			throw new Error(`User have no refreshToken set: ${this}`)
		}

		return this.refreshToken
	}

	setID(id: string): void {
		this.ID = id
	}

	get id(): string {
		if (!this.ID) {
			throw new Error(`User have no id set: ${this}`)
		}

		return this.ID
	}

	toString(): string {
		if (this.password) {
			return `LoginUser<"${this.email}", "${this.password}">`
		}

		return `LoginUser<"${this.email}">`
	}
}

export const loginUsers = new DomainStorage<LoginUserProperty, LoginUser>([
	new LoginUser(emails.test, passwords.test, [], true, true),
	new LoginUser(emails.test, passwords.testWrong, [], true, false),
	new LoginUser(emails.nonExisting, passwords.test, undefined, true, false),
	new LoginUser(emails.test, undefined, undefined, false),
	new LoginUser(emails.wrongFormat, undefined, undefined, false)
])
