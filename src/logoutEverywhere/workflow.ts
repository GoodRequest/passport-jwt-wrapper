import jsonwebtoken from 'jsonwebtoken'

import { IJwtPayload } from '../types/interfaces'
import { State } from '../State'

export default async function workflow(authHeader: string) {
	const [, accessToken] = authHeader.split(' ')

	// NOTE: token is valid, cause it already passed through verification (by passport)
	const decodedAccessTokenData = <IJwtPayload>jsonwebtoken.decode(accessToken)

	if (!State.refreshTokenRepository.invalidateUserRefreshTokens) {
		throw new Error("'invalidateUserRefreshTokens' is not implemented on UserTokenRepository")
	}

	await State.refreshTokenRepository.invalidateUserRefreshTokens(decodedAccessTokenData.uid)
}
