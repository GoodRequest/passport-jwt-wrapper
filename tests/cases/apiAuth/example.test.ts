import express, { Express } from 'express'
import i18next from 'i18next'
import { InitOptions as I18nextOptions } from 'i18next'
import i18nextMiddleware from 'i18next-http-middleware'
import i18nextBackend from 'i18next-fs-backend'
import config from 'config'
import request from 'supertest'
import { expect } from 'chai'
import passport from "passport";

import { createHash, initAuth } from "../../../src";
import { UserRepository } from "../../mocks/userRepository";
import { TokenRepository } from "../../mocks/tokenRepository";
import loginRouter from "../../mocks/loginRouter";
import errorMiddleware from "../../mocks/errorMiddleware";

const i18NextConfig: I18nextOptions = config.get('i18next')

let app: Express

class Domain<ValueType, EnumType> {
	value: ValueType
	properties: EnumType[]
	isValid: boolean
	isPositive: boolean

	constructor(value: ValueType, properties: EnumType[], isValid: boolean, isPositive: boolean) {
		this.value = value
		this.properties = properties
		this.isValid = isValid
		this.isPositive = isPositive
	}
}

interface DomainSet {
	get isValid(): boolean

	get isPositive(): boolean
}

const enum EmailProperties {}
const enum PasswordProperties {}

const emailDomains = {
	test: new Domain("test@goodrequest.com", [], true, true),
	nonExisting: new Domain("nonExisting@goodrequest.com", [], true, false),
	wrongFormat: new Domain("wrongFormat.com", [], false, false)
}

const passwordsDomains = {
	test: new Domain("password1234.", [], true, true),
	testWrong: new Domain("wrongPass456", [], true, false)
}

class LoginUser implements DomainSet {
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

const loginUsers: LoginUsersType = {
	test: new LoginUser(emailDomains.test, passwordsDomains.test),
	testWrong: new LoginUser(emailDomains.test, passwordsDomains.testWrong),
	noPassword: new LoginUser(emailDomains.test),
	nonExisting: new LoginUser(emailDomains.nonExisting),
	wrongEmailFormat: new LoginUser(emailDomains.wrongFormat)
}

describe('Login with i18next', () => {
	before(async () => {
		const userRepo = new UserRepository()

		// seed users
		for(let [key, user] of Object.entries(loginUsers)) {
			if(user.isValid && user.isPositive) {
				let password
				if(user.password) {
					password = await createHash(user.password?.value)
				}
				userRepo.add(user.email.value, password)
			}
		}

		// init express app
		app = express()

		app.use(express.urlencoded({ extended: true }))
		app.use(express.json())
		app.use(passport.initialize())

		// init authentication library
		initAuth(passport, {
			userRepository: userRepo,
			refreshTokenRepository: TokenRepository.getInstance()
		})

		// i18next config
		await i18next
			.use(i18nextMiddleware.LanguageDetector)
			.use(i18nextBackend)
			.init(JSON.parse(JSON.stringify(i18NextConfig))) // it has to be deep copied

		app.use(i18nextMiddleware.handle(i18next))

		app.use('/auth', loginRouter())
		app.use(errorMiddleware)
	})

	for(let [key, user] of Object.entries(loginUsers)) {
		if(user.isValid && user.isPositive) {
			it(`Testing valid user: ${user}`, async () => {
				const response = await request(app)
					.post('/auth/login')
					.send({
						email: user.email.value,
						password: user.password?.value
					})

				expect(response.statusCode).to.eq(200)
				expect(response.body.accessToken).to.exist
				expect(response.body.refreshToken).to.exist
			})
		} else {
			it(`Testing invalid user: ${user}`, async () => {
				const response = await request(app)
					.post('/auth/login')
					.send({
						email: user.email.value,
						password: user.password?.value
					})

				expect(response.statusCode).to.eq(401)
				expect(response.body.messages).to.exist
				expect(response.body.messages[0]).to.eq('Incorrect email or password')
			})
		}
	}

	it('No email', async () => {
		const response = await request(app)
			.post('/auth/login')
			.send({
				password: "testPass1234."
			})

		expect(response.statusCode).to.eq(401)
		expect(response.body.messages).to.exist
		expect(response.body.messages[0]).to.eq('Incorrect email or password')
	});

	it('No data', async () => {
		const response = await request(app)
			.post('/auth/login')

		expect(response.statusCode).to.eq(401)
		expect(response.body.messages).to.exist
		expect(response.body.messages[0]).to.eq('Incorrect email or password')
	});
});
