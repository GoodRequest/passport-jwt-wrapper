import { NextFunction, Request, Response } from 'express'

import { ErrorBuilder } from '../utils/ErrorBuilder'
import { State } from '../State'
import { PASSPORT_NAME } from '../utils/enums'
import { customTFunction } from '../utils/translations'
import { ID, IUser } from '../types/interfaces'

/**
 * Use as middleware before login endpoint
 * Usage: `router.use('/login', Login.guard(), ..., loginEndpoint)`
 */
export default (req: Request, res: Response, next: NextFunction) => {
	State.getInstance().passport.authenticate(PASSPORT_NAME.LOCAL, { session: false }, (err: any, userData: IUser<ID>) => {
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
