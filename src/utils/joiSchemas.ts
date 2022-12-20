import Joi from 'joi'
import { passwordRegEx } from './regex'
import { MESSAGE_TYPE } from './enums'

/**
 * Joi schema for response object with only messages array
 * ```js
 * {
 *		messages: {
 * 		message: string
 * 		type: MESSAGE_TYPE
 * 	}[]
 * }
 * ```
 */
export const fullMessagesResponse = Joi.object({
	messages: Joi.array()
		.items(
			Joi.object({
				message: Joi.string().required(),
				type: Joi.string().valid(MESSAGE_TYPE.SUCCESS).required()
			}).required()
		)
		.required()
})

/**
 * Joi schema for request password (with masked password value)
 * // TODO: better message https://github.com/Slonik923/passport-jwt-wrapper/issues/7
 */
export const passwordSchema = Joi.string()
	.regex(passwordRegEx)
	.max(255)
	.error((errors): any => {
		errors.forEach((error) => {
			// eslint-disable-next-line no-param-reassign
			error.value = '********'
		})

		return errors
	})
	.required()
