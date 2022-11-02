import config from 'config'

import { createJwt } from '../utils/jwt'
import { JWT_AUDIENCE } from '../utils/enums'
import { IPassportConfig } from '../types/config'
import { State } from '../State'
import { ID } from '../types/interfaces'

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
export async function getLoginTokens(userID: ID, familyID?: ID): Promise<ILoginResponse> {
	// get refresh token id
	const rid = await State.userTokenRepository.createRefreshTokenID();
	if(!familyID) {
		familyID = rid
	}
	const [accessToken, refreshToken] = await Promise.all([
		createJwt({
			uid: userID,
			rid,
			familyID
		}, {
			audience: JWT_AUDIENCE.API_ACCESS,
			expiresIn: passportConfig.jwt.api.exp
		}),
		createJwt({
			uid: userID,
			familyID
		}, {
			audience: JWT_AUDIENCE.API_REFRESH,
			expiresIn: passportConfig.jwt.api.refresh.exp,
			jwtid: `${rid}`
		})
	])

	// save tokens
	await State.userTokenRepository.saveRefreshToken(userID, familyID, refreshToken)
	await State.userTokenRepository.saveAccessToken?.(userID, familyID, accessToken)

	return {
		accessToken,
		refreshToken
	}
}
