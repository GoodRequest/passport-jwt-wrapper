import ms from 'ms'

import { createJwt } from '../utils/jwt'
import { JWT_AUDIENCE } from '../utils/enums'
import { State } from '../State'
import { ID, IJwtPayload, IRefreshJwtPayload } from '../types/interfaces'

export interface ILoginResponse {
	accessToken: string
	refreshToken: string
}

/**
 * return access and refresh tokens for given user
 * expirations are read from config
 * audience is from enum JWT_AUDIENCE
 * New refresh token id (`rid` / `jti` / `jwtid`) is obtained calling `userTokenRepository.createRefreshTokenID()`
 * refresh token is saved by calling `userTokenRepository.saveRefreshToken(userID, fid, rid, refreshToken)`
 * @param userID
 * @param familyID: when none is provided, refresh token id (jwtid) is used (creates new family ID)
 * @param payload
 */
export async function getTokens(userID: ID, familyID?: ID, payload?: Record<string, unknown>): Promise<ILoginResponse> {
	const state = State.getInstance()
	// get refresh token id
	const rid = await state.refreshTokenRepository.createTokenID()
	const fid = familyID ?? rid

	const passportConfig = State.getInstance().config.passport

	const [accessToken, refreshToken] = await Promise.all([
		createJwt(
			<IJwtPayload>{
				...payload,
				uid: userID,
				rid,
				fid
			},
			{
				audience: JWT_AUDIENCE.API_ACCESS,
				expiresIn: passportConfig.jwt.api.exp
			}
		),
		createJwt(
			<IRefreshJwtPayload>{
				uid: userID,
				fid
			},
			{
				audience: JWT_AUDIENCE.API_REFRESH,
				expiresIn: passportConfig.jwt.api.refresh.exp,
				jwtid: `${rid}`
			}
		)
	])

	// save tokens
	await state.refreshTokenRepository.saveRefreshToken(userID, fid, rid, refreshToken, ms(passportConfig.jwt.api.refresh.exp))

	return {
		accessToken,
		refreshToken
	}
}
