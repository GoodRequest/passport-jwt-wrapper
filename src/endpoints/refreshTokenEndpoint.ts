import { Request, Response } from 'express'
import jsonwebtoken from 'jsonwebtoken'
import config from 'config'

import { IPassportConfig } from '../types/config'
import { ErrorBuilder } from '../utils/ErrorBuilder'
import { JWT_AUDIENCE } from '../utils/enums'
import { State } from '../State'
import { getLoginTokens } from '../functions/getLoginTokens'
import { IRefreshJwtPayload } from '../types/interfaces'
import { TFunction } from 'i18next'
import Joi from 'joi'

const passportConfig: IPassportConfig = config.get('passport')

export const refreshTokenRequestSchema = Joi.object({
	body: Joi.object({
		refreshToken: Joi.string().required()
	}),
	query: Joi.object(),
	params: Joi.object()
})

export const refreshTokenResponseSchema = Joi.object({
	accessToken: Joi.string().required(),
	refreshToken: Joi.string().required()
})

function decodeJwt(token: string, t?: TFunction): Promise<IRefreshJwtPayload> {
	return new Promise((resolve, reject) => {
		jsonwebtoken.verify(
			token,
			passportConfig.jwt.secretOrKey,
			{
				audience: JWT_AUDIENCE.API_REFRESH,
			},
			(err, decoded: any) =>
			{
				if(err)
				{
					const message = 'error:Refresh token is not valid'
					return reject(new ErrorBuilder(401, t ? t(message) : message))
				}

				return resolve(decoded)
			}
		)
	})
}

export async function refreshTokenEndpoint(req: Request, res: Response) {
	const { body } = req

	// decode refresh token
	const decodedRefreshTokenData = await decodeJwt(body.refreshToken, req.t)

	// find if the token si valid
	const isTokenValid = await State.userTokenRepository.isRefreshTokenValid(decodedRefreshTokenData.jwtid, decodedRefreshTokenData.fid)

	if(!isTokenValid) {
		// invalidate refresh token family and if possible also access tokens
		await State.userTokenRepository.invalidateRefreshTokenFamily(decodedRefreshTokenData.fid)

		const message = 'error:Refresh token is not valid'
		throw new ErrorBuilder(401, req.t ? req.t(message) : message)
	}

	// check if the user exists
	const user = await State.userRepository.getUserById(`${decodedRefreshTokenData.uid}`)

	if(!user) {
		// invalidate refresh token family and if possible also access tokens
		await State.userTokenRepository.invalidateRefreshTokenFamily(decodedRefreshTokenData.fid)

		const message = 'error:Refresh token is not valid'
		throw new ErrorBuilder(401, req.t ? req.t(message) : message)
	}

	// refresh token rotation - invalidate already used token
	await State.userTokenRepository.invalidateRefreshToken(decodedRefreshTokenData.jwtid, decodedRefreshTokenData.fid)

	const tokens = getLoginTokens(user.id, decodedRefreshTokenData.fid)

	// TODO: return user?
	return res.json({
		...tokens
	})
}
