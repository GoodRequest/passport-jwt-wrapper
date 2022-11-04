import { AuthRequest, Response, NextFunction } from 'express'
import Joi from 'joi'

import { fullMessagesResponse, passwordSchema } from '../utils/joiSchemas'
import { State } from '../State'
import { createHash } from '../utils/jwt'
import { MESSAGE_TYPE } from '../utils/enums'

export const requestSchema = Joi.object({
	body: Joi.object({
		password: passwordSchema
	}),
	query: Joi.object(),
	params: Joi.object()
})

export const responseSchema = fullMessagesResponse

export async function endpoint(req: AuthRequest, res: Response, next: NextFunction) {
	try {
		const { body, user } = req

		const hash = await createHash(body.password)

		await State.userRepository.UpdateUserPassword(hash)

		await State.userTokenRepository.invalidateUserRefreshTokens(user.id)

		return res.json({
			messages: [
				{
					message: req.t ? req.t('Password was successfully changed') : 'Password was successfully changed',
					type: MESSAGE_TYPE.SUCCESS
				}
			]
		})
	} catch (err) {
		return next(err)
	}
}
