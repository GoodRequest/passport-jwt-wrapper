import { NextFunction, Request, Response } from 'express'

import { State } from '../State'
import { PASSPORT_NAME } from '../utils/enums'
import { ErrorBuilder } from '../utils/ErrorBuilder'
import { customTFunction } from '../utils/translations'
import { IUser } from '../types/interfaces'

/**
 * Guard middleware for password reset.
 * Needs to be a function, since passport is provided after import
 * @param req
 * @param res
 * @param next
 */
export default function guard(req: Request, res: Response, next: NextFunction) {
	State.getInstance().passport.authenticate(PASSPORT_NAME.JWT_PASSWORD_RESET, (err: any, userData: IUser) => {
		try {
			if (err) {
				return next(err)
			}
			if (!userData) {
				const t = req.t ?? customTFunction
				throw new ErrorBuilder(401, t('error:Password reset token is invalid'))
			}

			req.user = userData
			return next()
		} catch (e) {
			return next(e)
		}
	})(req, res)
}
