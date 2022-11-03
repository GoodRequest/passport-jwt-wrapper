import Joi from 'joi'
import { emailRegex, passwordRegEx } from './regex'
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
	messages: Joi.array().items(Joi.object({
		message: Joi.string().required(),
		type: Joi.string().valid(MESSAGE_TYPE.SUCCESS).required()
	}).required()).required()
})

/**
 * Joi schema for response pagination object
 * ```js
 * {
 * 		limit: number
 * 		page: number
 * 		totalPages: number
 * 		totalCount: number
 * }
 * ```
 */
export const paginationResponse = Joi.object({
	limit: Joi.number().integer().min(1).required(),
	page: Joi.number().integer().min(1).required(),
	totalPages: Joi.number().integer().min(0).required(),
	totalCount: Joi.number().integer().min(0).required()
}).required()

/**
 * Joi schema for request password (with masked password value)
 */
export const passwordSchema = Joi.string().regex(passwordRegEx).max(255).error((errors): any => {
	errors.forEach((error) => {
		error.value = '********'
	})

	return errors
}).required()

/**
 * Joi schema for request email (with custom error message for invalid email format)
 */
// eslint-disable-next-line security/detect-unsafe-regex
export const emailSchema = Joi.string().regex(emailRegex, 'email').max(255).required()

