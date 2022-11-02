import { Request, Response } from 'express'
import jsonwebtoken from 'jsonwebtoken'
import config from 'config'

import { IPassportConfig } from '../types/config'
import { ErrorBuilder } from '../utils/ErrorBuilder'
import { JWT_AUDIENCE } from '../utils/enums'
import { State } from '../State'
import { getLoginTokens } from '../functions/getLoginTokens'
import { IRefreshJwtPayload } from '../types/interfaces'

const passportConfig: IPassportConfig = config.get('passport')

function decodeJwt(token: string): Promise<IRefreshJwtPayload> {
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
					// TODO: i18next
					return reject(new ErrorBuilder(401, 'error:Refresh token is not valid'))
				}

				return resolve(decoded)
			}
		)
	})
}

export async function refreshTokenEndpoint(req: Request, res: Response) {
	const { body } = req

	// decode refresh token
	const decodedRefreshTokenData = await decodeJwt((<any>body).refreshToken)

	// TODO: split getting tokens by ID or by token
	// TODO: we don't need the token from storage, we just need to know if it is not invalidated
	// find if the token si valid
	const userToken = await State.userTokenRepository.getRefreshToken(decodedRefreshTokenData.jwtid, decodedRefreshTokenData.fid)

	if(!userToken) {
		// invalidate refresh token family and if possible also access tokens
		await State.userTokenRepository.invalidateRefreshTokenFamily(decodedRefreshTokenData.fid)
		State.userTokenRepository.invalidateAccessTokenFamily?.(decodedRefreshTokenData.fid)

		// TODO: i18next
		throw new ErrorBuilder(401, 'error:Refresh token is not valid')
	}

	// check if the user exists
	const user = await State.userRepository.getUserById(`${decodedRefreshTokenData.uid}`)

	if(!user) {
		// invalidate refresh token family and if possible also access tokens
		await State.userTokenRepository.invalidateRefreshTokenFamily(decodedRefreshTokenData.fid)
		State.userTokenRepository.invalidateAccessTokenFamily?.(decodedRefreshTokenData.fid)

		// TODO: i18next
		throw new ErrorBuilder(401, 'error:Refresh token is not valid')
	}

	// refresh token rotation - invalidate already used token
	await State.userTokenRepository.invalidateRefreshToken(decodedRefreshTokenData.jwtid, decodedRefreshTokenData.fid)

	const tokens = getLoginTokens(user.id, decodedRefreshTokenData.fid)

	// TODO: return user?
	return res.json({
		...tokens
	})
}
