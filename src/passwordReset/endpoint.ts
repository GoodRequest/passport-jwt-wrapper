import { Request, AuthRequest, Response, NextFunction } from 'express'
import Joi from 'joi'

import { fullMessagesResponse, passwordSchema } from '../utils/joiSchemas'
import workflow from './workflow'
import { MESSAGE_TYPE } from '../utils/enums'
import { customTFunction } from '../utils/translations'

export const requestSchema = Joi.object({
	body: Joi.object({
		password: passwordSchema
	}),
	query: Joi.object(),
	params: Joi.object()
})

export const responseSchema = fullMessagesResponse

export async function endpoint(req: Request, res: Response, next: NextFunction) {
	try {
		const { body, user } = req as AuthRequest

		await workflow(body.password, user.id)

		const t = req.t ?? customTFunction
		return res.json({
			messages: [
				{
					message: t('Password was successfully changed'),
					type: MESSAGE_TYPE.SUCCESS
				}
			]
		})
	} catch (err) {
		return next(err)
	}
}
