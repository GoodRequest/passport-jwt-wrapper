import { TFunction } from 'i18next'

import { decodeRefreshJwt } from '../utils/jwt'
import { State } from '../State'
import { ErrorBuilder } from '../utils/ErrorBuilder'
import { getTokens } from '../login'
import { ILoginResponse } from '../login/getTokens'

export default async function workflow(refreshToken: string, t: TFunction): Promise<ILoginResponse> {
	// decode refresh token
	const decodedRefreshTokenData = await decodeRefreshJwt(refreshToken, t)

	// find if the token si valid
	const isTokenValid = await State.userTokenRepository.isRefreshTokenValid(decodedRefreshTokenData.jwtid, decodedRefreshTokenData.fid)

	if (!isTokenValid) {
		// invalidate refresh token family and if possible also access tokens
		await State.userTokenRepository.invalidateRefreshTokenFamily(decodedRefreshTokenData.fid)

		const message = 'error:Refresh token is not valid'
		throw new ErrorBuilder(401, t(message))
	}

	// check if the user exists
	const user = await State.userRepository.getUserById(`${decodedRefreshTokenData.uid}`)

	if (!user) {
		// invalidate refresh token family and if possible also access tokens
		await State.userTokenRepository.invalidateRefreshTokenFamily(decodedRefreshTokenData.fid)

		const message = 'error:Refresh token is not valid'
		throw new ErrorBuilder(401, t(message))
	}

	// refresh token rotation - invalidate already used token
	await State.userTokenRepository.invalidateRefreshToken(decodedRefreshTokenData.jwtid, decodedRefreshTokenData.fid)

	return getTokens(user.id, decodedRefreshTokenData.fid)
}
