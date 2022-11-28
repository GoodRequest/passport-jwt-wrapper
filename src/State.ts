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
	private _invitationTokenRepository?: IInvitationTokenRepository<U>
	private _passwordResetTokenRepository?: IPasswordResetTokenRepository<U>

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

		this._invitationTokenRepository = invitationTokenRepository
		this._passwordResetTokenRepository = passwordResetTokenRepository
	}

	get passwordResetTokenRepository(): IPasswordResetTokenRepository<U> {
		if (!this._passwordResetTokenRepository) {
			throw new Error("Password Reset Repository was not provided to the authentication library ('@goodrequest/jwt-auth')")
		}

		return this._passwordResetTokenRepository
	}

	set passwordResetTokenRepository(value: IPasswordResetTokenRepository<U>) {
		this._passwordResetTokenRepository = value
	}
	get invitationTokenRepository(): IInvitationTokenRepository<U> {
		if (!this._invitationTokenRepository) {
			throw new Error("Invitation Token Repository was not provided to the authentication library ('@goodrequest/jwt-auth')")
		}

		return this._invitationTokenRepository
	}

	set invitationTokenRepository(value: IInvitationTokenRepository<U>) {
		this._invitationTokenRepository = value
	}
}
