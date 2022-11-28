import { NextFunction, Request, Response } from 'express'
import util from 'util'

import { ErrorBuilder } from '../../../src/utils/ErrorBuilder'
import { MESSAGE_TYPE } from '../../../src/utils/enums'
import { customTFunction } from '../../../src/utils/translations'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function errorMiddleware(err: ErrorBuilder, req: Request, res: Response, _next: NextFunction) {
	// if status does not exist, assign 500
	const errStatus = err.status || 500

	let messages
	if (errStatus < 500) {
		if (err.isJoi || err.items.length > 0) {
			messages = err.items
		} else {
			messages = [err.message]
		}
	} else {
		const t = req.t ?? customTFunction
		// eslint-disable-next-line no-console
		console.error(err.message, JSON.stringify(util.inspect(err)))
		messages = [
			{
				message: t('error:Something went wrong!'),
				type: MESSAGE_TYPE.ERROR
			}
		]
	}

	// return error
	return res.status(errStatus).json({ messages })
}
