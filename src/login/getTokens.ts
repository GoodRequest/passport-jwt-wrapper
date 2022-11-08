import config from 'config'

import { createJwt } from '../utils/jwt'
import { JWT_AUDIENCE } from '../utils/enums'
import { IPassportConfig } from '../types/config'
import { State } from '../State'
import { ID, IJwtPayload, IRefreshJwtPayload } from '../types/interfaces'

const passportConfig: IPassportConfig = config.get('passport')

export interface ILoginResponse {
	accessToken: string
	refreshToken: string
}

/**
 * return access and refresh tokens for given user
 * expirations are read from config
 * audience is from enum JWT_AUDIENCE
 * Refresh token id (`rid` / `jwtid`) is get from `userTokenRepository.createRefreshTokenID()`
 * calls `userTokenRepository.saveRefreshToken` and `userTokenRepository.saveAccessToken` if available
 * @param userID
 * @param familyID: when none is provided, refresh token id (jwtid) is used (creates new family ID)
 */
export async function getTokens(userID: ID, familyID?: ID): Promise<ILoginResponse> {
	// get refresh token id
	const rid = await State.refreshTokenRepository.createTokenID()
	const fid = familyID ?? rid

	const [accessToken, refreshToken] = await Promise.all([
		createJwt(
			<IJwtPayload>{
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
	await State.refreshTokenRepository.saveRefreshToken(rid, fid, refreshToken)

	return {
		accessToken,
		refreshToken
	}
}
