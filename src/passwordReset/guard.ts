import { NextFunction, Request, Response } from 'express'

import { State } from '../State'
import { PASSPORT_NAME } from '../utils/enums'
import { ErrorBuilder } from '../utils/ErrorBuilder'

export default (req: Request, res: Response, next: NextFunction) => {
	State.getInstance().passport.authenticate(PASSPORT_NAME.JWT_PASSWORD_RESET, (err, userData) => {
		try {
			if (err) {
				return next(err)
			}
			if (!userData) {
				const message = 'error:Token is not valid'
				return next(new ErrorBuilder(401, req.t ? req.t(message) : message))
			}

			req.user = userData
			return next()
		} catch (e) {
			return next(e)
		}
	})(req, res)
}
