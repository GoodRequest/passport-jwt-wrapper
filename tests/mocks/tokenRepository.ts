import { v4 as uuidv4 } from 'uuid'

import { IRefreshTokenRepository } from '../../src'

const logging = false

// eslint-disable-next-line import/prefer-default-export
export class TokenRepository implements IRefreshTokenRepository<string, number> {
	private static instance: TokenRepository
	private map = new Map<string, Map<string, string>>()

	static getInstance(): TokenRepository {
		if (!this.instance) {
			this.instance = new TokenRepository()
		}

		return this.instance
	}

	private constructor() {}

	createTokenID(): Promise<string> {
		const id = uuidv4()
		if (logging) {
			console.log(`[TokenRepository] new id: ${id}`)
		}

		return Promise.resolve(id)
	}

	saveRefreshToken(id: string, familyID: string, token: string): Promise<unknown> {
		if (logging) {
			console.log(`[TokenRepository] saving refresh token: ${id} (${familyID}): ${token}`)
		}
		let familyMap = this.map.get(familyID)
		if (!familyMap) {
			familyMap = new Map<string, string>()
			this.map.set(familyID, familyMap)
		}

		familyMap.set(id, token)

		return Promise.resolve(token)
	}

	isRefreshTokenValid(id: string, familyID: string): Promise<boolean> {
		const familyMap = this.map.get(familyID)

		const result = familyMap ? familyMap.has(id) : false
		if (logging) {
			console.log(`[TokenRepository] isRefreshTokenValid ${id} (${familyID}): ${result}`)
		}
		return Promise.resolve(result)
	}

	invalidateRefreshToken(id: string, familyID: string): Promise<void> {
		if (logging) {
			console.log(`[TokenRepository] invalidate refresh token: ${id} (${familyID})`)
		}
		const familyMap = this.map.get(familyID)
		familyMap?.delete(id)

		return Promise.resolve()
	}

	invalidateRefreshTokenFamily(familyID: string): Promise<void> {
		if (logging) {
			console.log(`[TokenRepository] invalidate refresh token family: ${familyID}`)
		}
		this.map.delete(familyID)

		return Promise.resolve()
	}
}
