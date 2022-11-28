// eslint-disable-next-line import/no-extraneous-dependencies
import passport, { PassportStatic } from 'passport'
import { ID, IUserRepository, IRefreshTokenRepository, IInvitationTokenRepository, IPasswordResetTokenRepository } from './types/interfaces'

// eslint-disable-next-line import/prefer-default-export
export class State<T extends ID, U extends ID> {
	static instance: State<any, any>
	static getInstance<T extends ID, U extends ID>() {
		if (!this.instance) {
			this.instance = new State<T, U>()
		}

		return this.instance
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	private constructor() {}
	private _passport?: PassportStatic
	private _userRepository?: IUserRepository<T>
	private _refreshTokenRepository?: IRefreshTokenRepository<T, U>
	private _invitationTokenRepository?: IInvitationTokenRepository<U>
	private _passwordResetTokenRepository?: IPasswordResetTokenRepository<U>

	get passport(): passport.PassportStatic {
		if (!this._passport) {
			throw new Error("Authentication library ('@goodrequest/jwt-auth') is not initialized")
		}

		return this._passport
	}

	set passport(value: passport.PassportStatic) {
		this._passport = value
	}

	get userRepository(): IUserRepository<T> {
		if (!this._userRepository) {
			throw new Error("Authentication library ('@goodrequest/jwt-auth') is not initialized")
		}

		return this._userRepository
	}

	set userRepository(value: IUserRepository<T>) {
		this._userRepository = value
	}

	get refreshTokenRepository(): IRefreshTokenRepository<T, U> {
		if (!this._refreshTokenRepository) {
			throw new Error("Authentication library ('@goodrequest/jwt-auth') is not initialized")
		}

		return this._refreshTokenRepository
	}

	set refreshTokenRepository(value: IRefreshTokenRepository<T, U>) {
		this._refreshTokenRepository = value
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
