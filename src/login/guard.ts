import { NextFunction, Request, Response } from 'express'

import { ErrorBuilder } from '../utils/ErrorBuilder'
import { State } from '../State'
import { PASSPORT_NAME } from '../utils/enums'
import { customTFunction } from '../utils/translations'

export default (req: Request, res: Response, next: NextFunction) => {
	State.getInstance().passport.authenticate(PASSPORT_NAME.LOCAL, { session: false }, (err, userData) => {
		try {
			if (err || !userData) {
				const t = req.t ?? customTFunction
				throw new ErrorBuilder(401, t(`error:Incorrect email or password`))
			}

			req.user = userData
			return next()
		} catch (e) {
			return next(e)
		}
	})(req, res)
}
