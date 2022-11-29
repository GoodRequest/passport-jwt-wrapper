// eslint-disable-next-line import/no-extraneous-dependencies
import { PassportStatic } from 'passport'
import { ID, IUserRepository, IRefreshTokenRepository, IInvitationTokenRepository, IPasswordResetTokenRepository } from './types/interfaces'

// eslint-disable-next-line import/prefer-default-export
export class State<T extends ID, U extends ID> {
	static instance: State<any, any>
	static getInstance(): State<ID, ID> {
		if (!this.instance) {
			throw new Error("Authentication library ('@goodrequest/jwt-auth') is not initialized")
		}

		return this.instance
	}

	static initialize<T extends ID, U extends ID>(
		passportStatic: PassportStatic,
		userRepository: IUserRepository<U>,
		refreshTokenRepository: IRefreshTokenRepository<T, U>,
		invitationTokenRepository?: IInvitationTokenRepository<U>,
		passwordResetTokenRepository?: IPasswordResetTokenRepository<U>
	): State<T, U> {
		this.instance = new State<T, U>(passportStatic, userRepository, refreshTokenRepository, invitationTokenRepository, passwordResetTokenRepository)

		return this.instance
	}

	readonly passport: PassportStatic
	readonly userRepository: IUserRepository<U>
	readonly refreshTokenRepository: IRefreshTokenRepository<T, U>
	readonly invitationTokenRepository?: IInvitationTokenRepository<U>
	readonly passwordResetTokenRepository?: IPasswordResetTokenRepository<U>

	private constructor(
		passportStatic: PassportStatic,
		userRepository: IUserRepository<U>,
		refreshTokenRepository: IRefreshTokenRepository<T, U>,
		invitationTokenRepository?: IInvitationTokenRepository<U>,
		passwordResetTokenRepository?: IPasswordResetTokenRepository<U>
	) {
		this.passport = passportStatic
		this.userRepository = userRepository
		this.refreshTokenRepository = refreshTokenRepository

		this.invitationTokenRepository = invitationTokenRepository
		this.passwordResetTokenRepository = passwordResetTokenRepository
	}
}
