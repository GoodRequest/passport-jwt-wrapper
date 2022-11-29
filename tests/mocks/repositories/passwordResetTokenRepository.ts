import { IPasswordResetTokenRepository } from '../../../src'

// eslint-disable-next-line import/prefer-default-export
export class PasswordResetTokenRepository implements IPasswordResetTokenRepository<string> {
	private map: Map<string, string> = new Map()

	invalidatePasswordResetToken(userID: string): Promise<void> {
		this.map.delete(userID)

		return Promise.resolve()
	}

	isPasswordTokenValid(userID: string): Promise<boolean> {
		return Promise.resolve(this.map.has(userID))
	}

	savePasswordResetToken(userID: string, token: string): Promise<unknown> {
		this.map.set(userID, token)

		return Promise.resolve()
	}
}
