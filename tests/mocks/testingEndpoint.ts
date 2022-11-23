import { Request, Response } from 'express'

export default function TestingEndpoint(req: Request, res: Response) {
	return res.sendStatus(200)
}
