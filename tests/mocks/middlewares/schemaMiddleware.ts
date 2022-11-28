import { Request, Response, NextFunction } from 'express'
import { ErrorBuilder } from '../../../src/utils/ErrorBuilder'

const options = {
	stripUnknown: true,
	abortEarly: false
}

export default (schema: any) => (req: Request, res: Response, next: NextFunction) => {
	if (!schema) {
		throw new Error('Validation schema is not provided')
	}

	const { body, params } = req
	const query: any = req

	Object.keys(query || {}).forEach((key) => {
		if (query[key] === 'null') {
			query[key] = null
		}
	})

	const result = schema.validate({ query, body, params }, options)

	if (result.error) {
		throw new ErrorBuilder(400, result.error.details)
	}

	req.body = result.value.body
	req.query = result.value.query
	req.params = result.value.params

	return next()
}
