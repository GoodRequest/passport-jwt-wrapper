import { Request, Response, NextFunction } from 'express'
//import Joi from 'joi'
import { createHash } from 'crypto'
import { MESSAGE_TYPE } from '../utils/ErrorBuilder'

/*
export const requestSchema = Joi.object({
	body: Joi.object({
		password: passwordSchema
	}),
	query: Joi.object(),
	params: Joi.object()
})

export const responseSchema = fullMessagesResponse
 */

// TODO: joi

export async function resetPasswordEndpoint(req: Request, res: Response, next: NextFunction) {
	try {
		const { body } = req

		// TODO: body as any
		const password = await createHash((body as any).password)

		// TODO: update user password

		// TODO: invalidate token family

		// TODO: i18next
		return res.json({
			messages: [{
				message: 'Password was successfully changed',
				type: MESSAGE_TYPE.SUCCESS
			}]
		})
	} catch (err) {
		return next(err)
	}
}
