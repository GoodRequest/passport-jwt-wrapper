import { NextFunction, Request, Response } from 'express'

import Joi from 'joi'
import workflow from './workflow'

export const requestSchema = Joi.object({
	body: Joi.object({
		refreshToken: Joi.string().required()
	}),
	query: Joi.object(),
	params: Joi.object()
})

export const responseSchema = Joi.object({
	accessToken: Joi.string().required(),
	refreshToken: Joi.string().required()
})

export async function endpoint(req: Request, res: Response, next: NextFunction) {
	try {
		const { body } = req

		const tokens = await workflow(body.refreshToken, req.t)

		return res.json({
			...tokens
		})
	} catch (e) {
		return next(e)
	}
}
