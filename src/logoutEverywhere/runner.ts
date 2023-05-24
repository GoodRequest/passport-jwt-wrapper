import jsonwebtoken from 'jsonwebtoken'

import { IJwtPayload } from '../types/interfaces'
import { State } from '../State'

/**
 * Logout from everywhere wokflow method, used in the `Logout.endpoint`
 * Invalidates all user refresh tokens by calling `refreshTokenRepository.invalidateUserRefreshTokens`. If this method is not provided and this endpoint is used, library throws exception.
 * All users access token are still valid after calling this endpoint.
 * @param authHeader
 */
export default async function runner(authHeader: string) {
	const [, accessToken] = authHeader.split(' ')

	// NOTE: token is valid, cause it already passed through verification (by passport)
	const decodedAccessTokenData = <IJwtPayload>jsonwebtoken.decode(accessToken)

	const state = State.getInstance()
	if (!state.refreshTokenRepository.invalidateUserRefreshTokens) {
		throw new Error("'invalidateUserRefreshTokens' is not implemented on UserTokenRepository")
	}

	await state.refreshTokenRepository.invalidateUserRefreshTokens(decodedAccessTokenData.uid)
}
