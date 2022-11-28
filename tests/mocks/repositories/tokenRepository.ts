import { v4 as uuidv4 } from 'uuid'

import { IRefreshTokenRepository } from '../../../src'

const logging = false

// eslint-disable-next-line import/prefer-default-export
export class TokenRepository implements IRefreshTokenRepository<string, string> {
	private static instance: TokenRepository
	private map = new Map<string, Map<string, Map<string, string>>>()

	static getInstance(): TokenRepository {
		if (!this.instance) {
			this.instance = new TokenRepository()
		}

		return this.instance
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private constructor() {}

	// eslint-disable-next-line class-methods-use-this
	createTokenID(): Promise<string> {
		const id = uuidv4()
		if (logging) {
			console.log(`[TokenRepository] new id: ${id}`)
		}

		return Promise.resolve(id)
	}

	saveRefreshToken(userID: string, familyID: string, tokenID: string, token: string): Promise<unknown> {
		if (logging) {
			console.log(`[TokenRepository] saving refresh token for user ${userID}: ${tokenID} (${familyID}): ${token}`)
		}
		let userMap = this.map.get(userID)
		if (!userMap) {
			userMap = new Map<string, Map<string, string>>()
			this.map.set(userID, userMap)
		}

		let familyMap = userMap.get(familyID)
		if (!familyMap) {
			familyMap = new Map<string, string>()
			userMap.set(familyID, familyMap)
		}

		familyMap.set(tokenID, token)

		return Promise.resolve(token)
	}

	isRefreshTokenValid(userID: string, familyID: string, tokenID: string): Promise<boolean> {
		const userMap = this.map.get(userID)
		if (!userMap) {
			return Promise.resolve(false)
		}

		const familyMap = userMap.get(familyID)

		const result = familyMap ? familyMap.has(tokenID) : false
		if (logging) {
			console.log(`[TokenRepository] isRefreshTokenValid for user ${userID} ${tokenID} (${familyID}): ${result}`)
		}
		return Promise.resolve(result)
	}

	invalidateRefreshToken(userID: string, familyID: string, tokenID: string): Promise<void> {
		if (logging) {
			console.log(`[TokenRepository] invalidate refresh token for user ${userID}: ${tokenID} (${familyID})`)
		}
		const userMap = this.map.get(userID)
		if (!userMap) {
			return Promise.resolve()
		}

		const familyMap = userMap.get(familyID)
		familyMap?.delete(tokenID)

		return Promise.resolve()
	}

	invalidateRefreshTokenFamily(userID: string, familyID: string): Promise<void> {
		if (logging) {
			console.log(`[TokenRepository] invalidate refresh token family: ${familyID}`)
		}
		const userMap = this.map.get(userID)
		if (!userMap) {
			return Promise.resolve()
		}

		userMap.delete(familyID)

		return Promise.resolve()
	}

	invalidateUserRefreshTokens(userID: string): Promise<void> {
		if (logging) {
			console.log(`[TokenRepository] invalidate user refresh tokens: ${userID}`)
		}

		this.map.delete(userID)
		return Promise.resolve()
	}
}
