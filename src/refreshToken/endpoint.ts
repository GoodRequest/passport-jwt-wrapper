import { Request, Response } from 'express'

import Joi from 'joi'
import { ErrorBuilder } from '../utils/ErrorBuilder'
import { State } from '../State'
import { getTokens } from '../login'
import { decodeRefreshJwt } from '../utils/jwt'

export const requestSchema = Joi.object({
	body: Joi.object({
		refreshToken: Joi.string().required()
	}),
	query: Joi.object(),
	params: Joi.object()
})

export const responseSchema = Joi.object({
	accessToken: Joi.string().required(),
	refreshToken: Joi.string().required()
})

export async function endpoint(req: Request, res: Response) {
	const { body } = req

	// decode refresh token
	const decodedRefreshTokenData = await decodeRefreshJwt(body.refreshToken, req.t)

	// find if the token si valid
	const isTokenValid = await State.userTokenRepository.isRefreshTokenValid(decodedRefreshTokenData.jwtid, decodedRefreshTokenData.fid)

	if (!isTokenValid) {
		// invalidate refresh token family and if possible also access tokens
		await State.userTokenRepository.invalidateRefreshTokenFamily(decodedRefreshTokenData.fid)

		const message = 'error:Refresh token is not valid'
		throw new ErrorBuilder(401, req.t ? req.t(message) : message)
	}

	// check if the user exists
	const user = await State.userRepository.getUserById(`${decodedRefreshTokenData.uid}`)

	if (!user) {
		// invalidate refresh token family and if possible also access tokens
		await State.userTokenRepository.invalidateRefreshTokenFamily(decodedRefreshTokenData.fid)

		const message = 'error:Refresh token is not valid'
		throw new ErrorBuilder(401, req.t ? req.t(message) : message)
	}

	// refresh token rotation - invalidate already used token
	await State.userTokenRepository.invalidateRefreshToken(decodedRefreshTokenData.jwtid, decodedRefreshTokenData.fid)

	const tokens = getTokens(user.id, decodedRefreshTokenData.fid)

	return res.json({
		...tokens
	})
}
