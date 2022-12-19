import { DomainSet, DomainStorage } from '../domain'

const emails = {
	test: 'test@goodrequest.com',
	wrong: 'wrong@goodrequest.com',
	noPass: 'noPass@goodrequest.com',
	nonExisting: 'nonExisting@goodrequest.com',
	wrongFormat: 'wrongFormat.com'
}

const passwords = {
	test: 'password1234.',
	testWrong: 'wrongPass456'
}

export enum LoginUserProperty {
	WRONG_PASS,
	NO_PASS,
	NON_EXISTING,
	WRONG_FORMAT
}

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
	new LoginUser(emails.wrong, passwords.testWrong, [LoginUserProperty.WRONG_PASS], true, false),
	new LoginUser(emails.noPass, undefined, [LoginUserProperty.NO_PASS], true, false),
	new LoginUser(emails.nonExisting, passwords.test, [LoginUserProperty.NON_EXISTING], true, false),
	new LoginUser(emails.wrongFormat, undefined, [LoginUserProperty.WRONG_FORMAT], false)
])
