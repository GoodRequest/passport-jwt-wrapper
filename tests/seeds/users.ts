import { Domain, DomainSet } from '../domain'

const enum EmailProperties {}
const enum PasswordProperties {}

const emailDomains = {
	test: new Domain('test@goodrequest.com', [], true, true),
	nonExisting: new Domain('nonExisting@goodrequest.com', [], true, false),
	wrongFormat: new Domain('wrongFormat.com', [], false, false)
}

const passwordsDomains = {
	test: new Domain('password1234.', [], true, true),
	testWrong: new Domain('wrongPass456', [], true, false)
}

export class LoginUser implements DomainSet {
	email: Domain<string, EmailProperties>
	password?: Domain<string, PasswordProperties>

	constructor(email: Domain<string, EmailProperties>, password?: Domain<string, PasswordProperties>) {
		this.email = email
		this.password = password
	}

	get isPositive(): boolean {
		return this.email.isPositive && (this.password?.isPositive ?? false) // no password -> invalid
	}

	get isValid(): boolean {
		return this.email.isValid && (this.password?.isValid ?? false) // no password -> invalid
	}

	toString(): string {
		return `LoginUser<"${this.email.value}", "${this.password?.value}">`
	}
}

type LoginUsersType = { [keyof: string]: LoginUser }

export const loginUsers: LoginUsersType = {
	test: new LoginUser(emailDomains.test, passwordsDomains.test),
	testWrong: new LoginUser(emailDomains.test, passwordsDomains.testWrong),
	noPassword: new LoginUser(emailDomains.test),
	nonExisting: new LoginUser(emailDomains.nonExisting),
	wrongEmailFormat: new LoginUser(emailDomains.wrongFormat)
}
