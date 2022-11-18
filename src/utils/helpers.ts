import { Request } from 'express'

// eslint-disable-next-line import/prefer-default-export
export function getTFunction(req: Request) {
	if (req.t) {
		return req.t
	}

	return (key: string) => key
}

export function customTFunction(req: Request, key: string) {
	if (req.t) {
		return req.t(key)
	}

	const splitted = key.split(':')
	return splitted.slice(1).join(':')
}
