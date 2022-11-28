import { IInvitationTokenRepository } from '../../../src'

// eslint-disable-next-line import/prefer-default-export
export class InvitationTokenRepository implements IInvitationTokenRepository<string> {
	private map: Map<string, string> = new Map()

	isInvitationTokenValid(userID: string): Promise<boolean> {
		return Promise.resolve(this.map.has(userID))
	}

	saveInvitationToken(userID: string, token: string): Promise<unknown> {
		this.map.set(userID, token)

		return Promise.resolve()
	}

	invalidateInvitationToken(userID: string): Promise<void> {
		this.map.delete(userID)

		return Promise.resolve()
	}
}
