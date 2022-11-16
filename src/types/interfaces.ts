interface IUser<UserIDType extends ID> {
	id: UserIDType
	hash?: string
}

export type GetUserByEmailFunction<UserIDType extends ID> = (email: string) => Promise<IUser<UserIDType> | undefined>

export type GetUserByIdFunction<UserIDType extends ID> = (id: UserIDType) => Promise<IUser<UserIDType> | undefined>

export interface IUserRepository<UserIDType extends ID> {
	getUserById: GetUserByIdFunction<UserIDType>
	getNewUserById?: GetUserByIdFunction<UserIDType>
	getUserByEmail: GetUserByEmailFunction<UserIDType>
	updateUserPassword: (userID: UserIDType, newPassword: string) => Promise<unknown>
}

export type ID = string | number

export interface IInvitationTokenRepository<UserIDType extends ID> {
	saveInvitationToken: (userID: UserIDType, token: string) => Promise<unknown>
	isInvitationTokenValid: (userID: UserIDType) => Promise<boolean>
	// invalidateInvitationToken: (userID: UserIDType) => Promise<void> // not needed in the library
}

export interface IPasswordResetTokenRepository<UserIDType extends ID> {
	// password reset tokens -- are optional, needed only when password reset cancellation is required
	savePasswordResetToken: (userID: UserIDType, token: string) => Promise<unknown> // user can have one password reset token
	isPasswordTokenValid: (userID: UserIDType) => Promise<boolean>
	// invalidatePasswordResetToken?: (userID: UserIDType) => Promise<void> // not needed in the library
}

export interface IRefreshTokenRepository<TokenIDType extends ID, UserIDType extends ID> {
	createTokenID: () => Promise<TokenIDType>
	saveRefreshToken: (id: TokenIDType, familyID: TokenIDType, token: string) => Promise<unknown>
	isRefreshTokenValid: (id: TokenIDType, familyID: TokenIDType) => Promise<boolean>
	invalidateRefreshToken: (id: TokenIDType, familyID: TokenIDType) => Promise<void>
	invalidateRefreshTokenFamily: (familyID: TokenIDType) => Promise<void>
	invalidateUserRefreshTokens?: (userID: UserIDType) => Promise<void>
}

export interface IBaseJwtPayload {
	uid: ID // userID
	fid: ID // token family ID
	exp: number // expiration
	iat: number // issued at
	aud: string // audience
}
export interface IJwtPayload extends IBaseJwtPayload {
	rid: ID // refresh token ID
}
export interface IRefreshJwtPayload extends IBaseJwtPayload {
	jti: ID // jwt ID
}
