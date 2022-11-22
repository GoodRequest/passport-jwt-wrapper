import request from 'supertest'
import { Express } from 'express'

import { LoginUser } from './seeds/users'

export const languages = ['en', 'sk']

export async function loginUserAndSetTokens(app: Express, user: LoginUser): Promise<void> {
	const response = await request(app).post('/auth/login').send({
		email: user.email,
		password: user.password
	})

	const { accessToken, refreshToken } = response.body
	user.setTokens(accessToken, refreshToken)
}
