import jsonwebtoken from 'jsonwebtoken'

import { IJwtPayload } from '../types/interfaces'
import { State } from '../State'

/**
 * Logout wokflow method, used in the `Logout.endpoint`
 * Invalidates whole refresh token family. Access token is still valid after calling this endpoint.
 * @param authHeader
 */
export default async function runner(authHeader: string) {
	const [, accessToken] = authHeader.split(' ')

	// NOTE: token is valid, cause it already passed through verification (by passport)
	const decodedAccessTokenData = <IJwtPayload>jsonwebtoken.decode(accessToken)

	await State.getInstance().refreshTokenRepository.invalidateRefreshTokenFamily(decodedAccessTokenData.uid, decodedAccessTokenData.fid)
}
