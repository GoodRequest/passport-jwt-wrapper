import jsonwebtoken from 'jsonwebtoken'

import { IJwtPayload } from '../types/interfaces'
import { State } from '../State'

export default async function workflow(authHeader: string) {
	const [, accessToken] = authHeader.split(' ')

	// NOTE: token is valid, cause it already passed through verification (by passport)
	const decodedAccessTokenData = <IJwtPayload>jsonwebtoken.decode(accessToken)

	const state = State.getInstance()
	if (!state.refreshTokenRepository.invalidateUserRefreshTokens) {
		throw new Error("'invalidateUserRefreshTokens' is not implemented on UserTokenRepository")
	}

	await state.refreshTokenRepository.invalidateUserRefreshTokens(decodedAccessTokenData.uid)
}
