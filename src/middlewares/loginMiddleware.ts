import { NextFunction, Request, Response } from 'express'
import { ErrorBuilder } from '../utils/ErrorBuilder'
import { State } from '../State'
import { PASSPORT_NAME } from '../utils/enums'

export function LoginMiddleware(req: Request, res: Response, next: NextFunction) {
	State.passport.authenticate(PASSPORT_NAME.LOCAL, { session: false }, (err, userData) => {
		try {
			if (err || !userData) {
				throw new ErrorBuilder(401, req.t ? req.t('error:Incorrect email or password') : 'error:Incorrect email or password')
			}

			req.user = userData
			return next()
		} catch (e) {
			return next(e)
		}
	})(req, res)
}
