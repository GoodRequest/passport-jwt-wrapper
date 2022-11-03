import { Request as OriginalRequest } from 'express'
import { TFunction } from 'i18next'

interface UserModel {
	id: number
	email: string
}

declare module 'express' {
	export interface Request extends Omit<OriginalRequest, 'query'> {
		query: any,
		user?: UserModel
		requestID: string
		t: TFunction
	}

	interface AuthRequest extends Request {
		user: UserModel
	}
}
