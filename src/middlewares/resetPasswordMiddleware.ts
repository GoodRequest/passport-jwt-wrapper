import { State } from '../State'
import { PASSPORT_NAME } from '../utils/enums'
import { NextFunction, Request, Response } from 'express'
import { ErrorBuilder } from '../utils/ErrorBuilder'

export function resetPasswordMiddleware(req: Request, res: Response, next: NextFunction) {
	State.passport.authenticate(PASSPORT_NAME.JWT_PASSWORD_RESET, (err, userData) => {
		try {
			if (err) {
				return next(err)
			}
			if (!userData) {
				// TODO: i18next
				return next(new ErrorBuilder(401, 'error:Token is not valid'))
			}

			req.user = userData
			return next()
		} catch (e) {
			return next(e)
		}
	})(req, res)
}
