import request from 'supertest'
import { Express } from 'express'

import { expect } from 'chai'
import { LoginUser, loginUsers } from './seeds/users'
import { UserRepository } from './mocks/userRepository'

export const languages = ['en', 'sk']

export async function loginUserAndSetTokens(app: Express, user: LoginUser): Promise<void> {
	const response = await request(app).post('/auth/login').send({
		email: user.email,
		password: user.password
	})

	expect(response.statusCode).to.eq(200)
	// eslint-disable-next-line @typescript-eslint/no-unused-expressions
	expect(response.body.accessToken).to.exist
	// eslint-disable-next-line @typescript-eslint/no-unused-expressions
	expect(response.body.refreshToken).to.exist

	const { accessToken, refreshToken } = response.body
	user.setTokens(accessToken, refreshToken)
}

export async function testEndpoint(app: Express, accessToken: string) {
	const response = await request(app).get('/endpoint').set('Authorization', `Bearer ${accessToken}`)

	expect(response.statusCode).to.eq(200)
}

export async function seedUserAndSetID(userRepo: UserRepository, user: LoginUser): Promise<void> {
	const repoUser = await userRepo.add(user.email, user.password)
	user.setID(repoUser.id)
}

export function getUser(): LoginUser {
	const user = loginUsers.getPositiveValue()
	if (!user) {
		throw new Error('No positive user')
	}

	return user
}
