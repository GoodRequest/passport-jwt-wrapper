export interface IUser<UserIDType extends ID> {
	id: UserIDType
	hash?: string
}

export interface IConfirmedUser<UserIDType extends ID> extends IUser<UserIDType> {
	hash: string
}

export type GetUserByEmailFunction<UserIDType extends ID> = (email: string) => Promise<IConfirmedUser<UserIDType> | undefined>

export type GetUserByIdFunction<UserIDType extends ID> = (id: UserIDType) => Promise<IUser<UserIDType> | undefined>

export interface IUserRepository<UserIDType extends ID> {
	getUserById: GetUserByIdFunction<UserIDType>
	/**
	 * Optional method, should be used when non-registered (invited) user is not returned by `getUserById`
	 */
	getNewUserById?: GetUserByIdFunction<UserIDType>
	/**
	 * Method return user, if one with given email exists. User needs to contain `hash`, so the password comparison can be made
	 */
	getUserByEmail: GetUserByEmailFunction<UserIDType>
	updateUserPassword: (userID: UserIDType, newPasswordHash: string) => Promise<unknown>
}

export type ID = string | number

export interface IInvitationTokenRepository<UserIDType extends ID> {
	saveInvitationToken: (userID: UserIDType, token: string, expiresIn: number) => Promise<unknown>
	isInvitationTokenValid: (userID: UserIDType) => Promise<boolean>
	/// not needed by this library, but should be implemented
	invalidateInvitationToken?: (userID: UserIDType) => Promise<void>
}

export interface IPasswordResetTokenRepository<UserIDType extends ID> {
	savePasswordResetToken: (userID: UserIDType, token: string, expiresIn: number) => Promise<unknown> // user can have one password reset token
	isPasswordTokenValid: (userID: UserIDType) => Promise<boolean>
	/// not needed by this library, but should be implemented
	invalidatePasswordResetToken?: (userID: UserIDType) => Promise<void> // not needed by this library
}

export interface IRefreshTokenRepository<TokenIDType extends ID, UserIDType extends ID> {
	createTokenID: () => Promise<TokenIDType>
	saveRefreshToken: (userID: UserIDType, familyID: TokenIDType, tokenID: TokenIDType, token: string, expiresIn: number) => Promise<unknown>
	isRefreshTokenValid: (userID: UserIDType, familyID: TokenIDType, tokenID: TokenIDType) => Promise<boolean>
	invalidateRefreshToken: (userID: UserIDType, familyID: TokenIDType, tokenID: TokenIDType) => Promise<void>
	invalidateRefreshTokenFamily: (userID: UserIDType, familyID: TokenIDType) => Promise<void>
	invalidateUserRefreshTokens?: (userID: UserIDType) => Promise<void>
}

export interface IBaseJwtPayload {
	// userID
	uid: ID
	// token family ID
	fid: ID
	// expiration
	exp: number
	// issued at
	iat: number
	// audience
	aud: string
}
export interface IJwtPayload extends IBaseJwtPayload {
	// refresh token ID
	rid: ID
}
export interface IRefreshJwtPayload extends IBaseJwtPayload {
	// jwt ID
	jti: ID
}
