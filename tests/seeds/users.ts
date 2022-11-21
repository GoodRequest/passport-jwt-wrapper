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
	email: string
	password?: string
	properties: LoginUserProperty[]
	accessToken?: string
	refreshToken?: string
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
