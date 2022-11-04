import { Request } from 'express'

export function getTFunction(req: Request) {
	if(req.t) {
		return req.t
	}

	return (key: string) => key
}
