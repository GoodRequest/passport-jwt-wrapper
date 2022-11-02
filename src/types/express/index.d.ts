import { Request as OriginalRequest } from 'express'

import { Models } from '../../db/models'

interface UserModel {
	id: number
	email: string
}

declare module 'express' {
	interface Request extends OriginalRequest {
		// eslint-disable-next-line @typescript-eslint/ban-types
		body: {}
		// eslint-disable-next-line @typescript-eslint/ban-types
		query: {}
		// eslint-disable-next-line @typescript-eslint/ban-types
		params: {}
		models: Models & ViewModels
		requestID: string
	}

	interface AuthRequest extends Request {
		user: UserModel
	}
}
