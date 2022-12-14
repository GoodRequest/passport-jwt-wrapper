import { Request as OriginalRequest } from 'express'

interface UserModel {
	id: string
	email: string
}

declare module 'express' {
	export interface Request extends Omit<OriginalRequest, 'query'> {
		query: any
		requestID?: string
		t: TFunction
	}

	export interface AuthRequest extends Request {
		user: UserModel
	}
}
