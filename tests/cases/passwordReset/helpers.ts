import request, { Response } from 'supertest'
import { Express, Router } from 'express'

import { PasswordReset } from '../../../src'
import errorMiddleware from '../../mocks/middlewares/errorMiddleware'
import schemaMiddleware from '../../mocks/middlewares/schemaMiddleware'

import * as enErrors from '../../../locales/en/error.json'
import * as skErrors from '../../../locales/sk/error.json'
import * as enTranslations from '../../../locales/en/translation.json'
import * as skTranslations from '../../../locales/sk/translation.json'

export function passwordChangeString(language?: string) {
	if (language && language === 'sk') {
		return skTranslations['Password was successfully changed']
	}

	return enTranslations['Password was successfully changed']
}

export function invalidPasswordResetTokenErrorString(language?: string): string {
	if (language && language === 'sk') {
		return skErrors['Password reset token is invalid']
	}

	return enErrors['Password reset token is invalid']
}

export function callEndpoint(app: Express, password: string, token: string, language = 'sk'): Promise<Response> {
	return request(app).post('/user/password-reset').set('accept-language', language).set('authorization', `Bearer ${token}`).send({
		password
	})
}

export async function getPasswordToken(email: string): Promise<string> {
	const token = await PasswordReset.getToken(email)
	if (!token) {
		throw new Error(`No password reset token for ${email}`)
	}

	return token[0]
}

export function setupRouters(app: Express) {
	const userRouter = Router()
	userRouter.post('/password-reset', PasswordReset.guard, schemaMiddleware(PasswordReset.requestSchema), PasswordReset.workflow)

	app.use('/user', userRouter)

	app.use(errorMiddleware)
}
