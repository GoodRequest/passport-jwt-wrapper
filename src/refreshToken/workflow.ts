import { Request } from 'express'

import { verifyRefreshJWT } from '../utils/jwt'
import { State } from '../State'
import { ErrorBuilder } from '../utils/ErrorBuilder'
import { getTokens } from '../login'
import { ILoginResponse } from '../login/getTokens'
import { customTFunction } from '../utils/translations'

/**
 * Method used in the `RefreshToken.endpoint`
 * Internally decodes (and validates) refresh token. If the token is not valid `refreshTokenRepository.invalidateRefreshTokenFamily` is called - which invalidates all refresh tokens ranted based on same login event
 * When token is valid, user is fetched using `userRepository.getUserById`. Again, when no user is returned whole refresh token family is invalidated.
 * Refresh token is then invalidated, but new access and refresh tokens are generated
 * return new access and refresh tokens - refresh token is passed as parameter to the `refreshTokenRepository.saveRefreshToken` method
 * @param refreshToken
 * @param req
 */
export default async function workflow(refreshToken: string, req: Request): Promise<ILoginResponse> {
	const t = req.t ?? customTFunction
	// decode refresh token
	const decodedRefreshTokenData = await verifyRefreshJWT(refreshToken, t)

	const state = State.getInstance()
	const { refreshTokenRepository, userRepository } = state
	// find if the token si valid
	const isTokenValid = await refreshTokenRepository.isRefreshTokenValid(decodedRefreshTokenData.uid, decodedRefreshTokenData.fid, decodedRefreshTokenData.jti)

	if (!isTokenValid) {
		// invalidate refresh token family and if possible also access tokens
		await refreshTokenRepository.invalidateRefreshTokenFamily(decodedRefreshTokenData.uid, decodedRefreshTokenData.fid)

		throw new ErrorBuilder(401, t('error:Refresh token is not valid'))
	}

	// check if the user exists
	const user = await userRepository.getUserById(`${decodedRefreshTokenData.uid}`)

	if (!user) {
		// invalidate refresh token family (all tokens granted from single login action)
		await refreshTokenRepository.invalidateRefreshTokenFamily(decodedRefreshTokenData.uid, decodedRefreshTokenData.fid)

		throw new ErrorBuilder(401, t('error:Refresh token is not valid'))
	}

	// refresh token rotation - invalidate already used token
	await refreshTokenRepository.invalidateRefreshToken(decodedRefreshTokenData.uid, decodedRefreshTokenData.fid, decodedRefreshTokenData.jti)

	return getTokens(user.id, decodedRefreshTokenData.fid)
}
