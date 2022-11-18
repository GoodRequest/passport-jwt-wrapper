import { Router } from 'express'
import { Login } from '../../src'

const router = Router()

export default () => {
	router.post('/login', Login.guard, async (req: any, res) => {
		try {
			const { user } = req

			const tokens = await Login.getTokens(user.id)

			return res.json({
				...tokens,
				user: {
					id: user.id
				}
			})
		} catch (e) {
			return res.status(500).json({ message: e })
		}
	})

	return router
}
