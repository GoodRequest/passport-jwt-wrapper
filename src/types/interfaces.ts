interface IUser {
	id: number | string,
	hash: string,
}

export type GetUserByEmailFunction = (email: string) => Promise<IUser | null>

export type GetUserByIdFunction<T extends ID> = (id: T) => Promise<IUser | null>

export interface IUserRepository<T extends ID> {
	getUserById: GetUserByIdFunction<T>
	getUserByEmail: GetUserByEmailFunction
	UpdateUserPassword: (newPassword: string) => Promise<any>
}

export type ID = string | number;

export interface IUserTokenRepository<TokenIDType extends ID, UserIDType extends ID> {
	// refresh tokens
	createTokenID: () => Promise<TokenIDType>
	saveRefreshToken: (id: TokenIDType, familyID: TokenIDType, token: string) => Promise<any>
	isRefreshTokenValid: (id: TokenIDType, familyID: TokenIDType) => Promise<boolean>
	invalidateRefreshToken: (id: TokenIDType, familyID: TokenIDType) => Promise<void>
	invalidateRefreshTokenFamily: (familyID: TokenIDType) => Promise<void>
	invalidateUserRefreshTokens: (userID: UserIDType) => Promise<void>
	// password reset tokens -- are optional, needed only when password reset cancellation is required
	savePasswordResetToken?: (userID: UserIDType, token: string) => Promise<any> // user can have one password reset token
	isPasswordTokenValid?: (userID: UserIDType) => Promise<boolean>
	// invalidatePasswordResetToken?: (userID: UserIDType) => Promise<void> // not needed in the library
}

export interface IBaseJwtPayload {
	uid: ID // userID
	fid: ID  //token family ID
	exp: number // expiration
	iat: number // issued at
	aud: string // audience
}
export interface IJwtPayload extends IBaseJwtPayload {
	rid: ID //refresh token ID
}
export interface IRefreshJwtPayload extends IBaseJwtPayload {
	jwtid: ID // jwt ID
}
