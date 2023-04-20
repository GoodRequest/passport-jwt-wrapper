// eslint-disable-next-line import/no-extraneous-dependencies
import { PassportStatic } from 'passport'
import { ID, IUserRepository, IRefreshTokenRepository, IInvitationTokenRepository, IPasswordResetTokenRepository } from './types/interfaces'
import { IPassportJwtWrapperConfig } from './types/config'

/**
 * Internal class for keeping state,
 * for now it consist of passport instance and repositories
 */
// eslint-disable-next-line import/prefer-default-export
export class State<T extends ID, U extends ID> {
	static instance?: State<any, any>
	static getInstance(): State<ID, ID> {
		if (!this.instance) {
			throw new Error("Authentication library ('@goodrequest/passport-jwt-wrapper') is not initialized")
		}

		return this.instance
	}

	static initialize<T extends ID, U extends ID>(
		config: IPassportJwtWrapperConfig,
		passportStatic: PassportStatic,
		userRepository: IUserRepository<U>,
		refreshTokenRepository: IRefreshTokenRepository<T, U>,
		invitationTokenRepository?: IInvitationTokenRepository<U>,
		passwordResetTokenRepository?: IPasswordResetTokenRepository<U>
	): State<T, U> {
		this.instance = new State<T, U>(config, passportStatic, userRepository, refreshTokenRepository, invitationTokenRepository, passwordResetTokenRepository)

		return this.instance
	}

	readonly passport: PassportStatic
	readonly userRepository: IUserRepository<U>
	readonly config: IPassportJwtWrapperConfig
	readonly refreshTokenRepository: IRefreshTokenRepository<T, U>
	readonly invitationTokenRepository?: IInvitationTokenRepository<U>
	readonly passwordResetTokenRepository?: IPasswordResetTokenRepository<U>

	private constructor(
		config: IPassportJwtWrapperConfig,
		passportStatic: PassportStatic,
		userRepository: IUserRepository<U>,
		refreshTokenRepository: IRefreshTokenRepository<T, U>,
		invitationTokenRepository?: IInvitationTokenRepository<U>,
		passwordResetTokenRepository?: IPasswordResetTokenRepository<U>
	) {
		this.config = config
		this.passport = passportStatic
		this.userRepository = userRepository
		this.refreshTokenRepository = refreshTokenRepository

		this.invitationTokenRepository = invitationTokenRepository
		this.passwordResetTokenRepository = passwordResetTokenRepository
	}
}
