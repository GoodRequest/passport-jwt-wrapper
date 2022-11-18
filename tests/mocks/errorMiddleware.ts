import {NextFunction, Request, Response} from "express";
import util from 'util'

import {ErrorBuilder} from "../../src/utils/ErrorBuilder";
import {MESSAGE_TYPE} from "../../src/utils/enums";

export default function errorMiddleware(err: ErrorBuilder, req: Request, res: Response, _next: NextFunction) {
	// if status does not exist, assign 500
	const errStatus = err.status || 500

	let messages
	if (errStatus < 500) {
		messages = [err.message]
	} else {
		console.error(err.message, JSON.stringify(util.inspect(err)))
		messages = [
			{
				message: req.t('error:Something went wrong!'),
				type: MESSAGE_TYPE.ERROR
			}
		]
	}

	// return error
	return res.status(errStatus).json({ messages })
}