import { v4 as uuidv4 } from 'uuid'

import { IRefreshTokenRepository } from '../../../src'

const logging = false

// eslint-disable-next-line import/prefer-default-export
export class RefreshTokenRepository implements IRefreshTokenRepository<string, string> {
	private static instance: RefreshTokenRepository
	private map = new Map<string, Map<string, Map<string, string>>>()

	static getInstance(): RefreshTokenRepository {
		if (!this.instance) {
			this.instance = new RefreshTokenRepository()
		}

		return this.instance
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private constructor() {}

	// eslint-disable-next-line class-methods-use-this
	createTokenID(): Promise<string> {
		const id = uuidv4()
		if (logging) {
			console.log(`[RefreshTokenRepository] new id: ${id}`)
		}

		return Promise.resolve(id)
	}

	saveRefreshToken(userID: string, familyID: string, tokenID: string, token: string): Promise<unknown> {
		if (logging) {
			console.log(`[RefreshTokenRepository] saving refresh token for user ${userID}: ${tokenID} (${familyID}): ${token}`)
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
			console.log(`[RefreshTokenRepository] isRefreshTokenValid for user ${userID} ${tokenID} (${familyID}): ${result}`)
		}
		return Promise.resolve(result)
	}

	invalidateRefreshToken(userID: string, familyID: string, tokenID: string): Promise<void> {
		if (logging) {
			console.log(`[RefreshTokenRepository] invalidate refresh token for user ${userID}: ${tokenID} (${familyID})`)
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
			console.log(`[RefreshTokenRepository] invalidate refresh token family: ${familyID}`)
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
			console.log(`[RefreshTokenRepository] invalidate user refresh tokens: ${userID}`)
		}

		this.map.delete(userID)
		return Promise.resolve()
	}
}
