import { NextFunction, Request, Response } from 'express'

import Joi from 'joi'
import runner from './runner'

/**
 * Refresh Token Request Schema:
 * `refreshToken` should be passed in body
 */
export const requestSchema = Joi.object({
	body: Joi.object({
		refreshToken: Joi.string().required()
	}),
	query: Joi.object(),
	params: Joi.object()
})

/**
 * refresh Token Response Schema:
 * {`accessToken`, `refreshToken`}
 */
export const responseSchema = Joi.object({
	accessToken: Joi.string().required(),
	refreshToken: Joi.string().required()
})

/**
 * Endpoint for refreshing token
 * Usage: `router.use('/refresh-token', schemaMiddleware(RefreshToken.requestSchema), RefreshToken.endpoint)`
 * @param req
 * @param res
 * @param next
 */
export async function workflow(req: Request, res: Response, next: NextFunction) {
	try {
		const { body } = req

		const tokens = await runner(body.refreshToken, req)

		return res.json({
			...tokens
		})
	} catch (e) {
		return next(e)
	}
}
