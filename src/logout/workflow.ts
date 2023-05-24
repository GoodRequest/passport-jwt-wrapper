import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'

import { fullMessagesResponse } from '../utils/joiSchemas'
import { MESSAGE_TYPE } from '../utils/enums'
import runner from './runner'
import { ErrorBuilder } from '../utils/ErrorBuilder'
import { customTFunction } from '../utils/translations'

/**
 * Logout endpoint request schema - empty
 */
export const requestSchema = Joi.object({
	body: Joi.object(),
	query: Joi.object(),
	params: Joi.object()
})

/**
 * Logout endpoint response schema - full message
 */
export const responseSchema = fullMessagesResponse

/**
 * Logout endpoint
 * Usage: `router.post('/logout', ApiAuth.guard(), schemaMiddleware(Logout.requestSchema), Logout.endpoint)`
 * @param req
 * @param res
 * @param next
 */
export async function workflow(req: Request, res: Response, next: NextFunction) {
	try {
		const authHeader = req.headers.authorization

		const t = req.t ?? customTFunction
		if (!authHeader) {
			throw new ErrorBuilder(401, t('Unauthorized'))
		}

		await runner(authHeader)

		return res.json({
			messages: [
				{
					type: MESSAGE_TYPE.SUCCESS,
					message: t('You were successfully logged out')
				}
			]
		})
	} catch (err) {
		return next(err)
	}
}
