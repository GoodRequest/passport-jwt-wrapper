import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'

import { fullMessagesResponse } from '../utils/joiSchemas'
import { MESSAGE_TYPE } from '../utils/enums'
import workflow from './workflow'
import { ErrorBuilder } from '../utils/ErrorBuilder'
import { customTFunction } from '../utils/helpers'

export const requestSchema = Joi.object({
	body: Joi.object(),
	query: Joi.object(),
	params: Joi.object()
})

export const responseSchema = fullMessagesResponse

export async function endpoint(req: Request, res: Response, next: NextFunction) {
	try {
		const authHeader = req.headers.authorization

		if (!authHeader) {
			throw new ErrorBuilder(401, customTFunction(req, 'Unauthorized'))
		}

		await workflow(authHeader)

		return res.json({
			messages: [
				{
					type: MESSAGE_TYPE.SUCCESS,
					message: customTFunction(req, 'You were successfully logged out')
				}
			]
		})
	} catch (err) {
		return next(err)
	}
}
