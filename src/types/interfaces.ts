interface IUser {
	id: number | string,
	hash: string,
}

export type GetUserByEmailFunction = (email: string) => Promise<IUser | null>

export type GetUserByIdFunction<T extends ID> = (id: T) => Promise<IUser | null>

export interface IUserRepository<T extends ID> {
	getUserById: GetUserByIdFunction<T>
	getUserByEmail: GetUserByEmailFunction
}

export type SaveUserTokenFunction<T extends string | number> = (id: T, familyID: T, token: string) => Promise<any>

export type ID = string | number;

export interface IUserTokenRepository<T extends ID> {
	// refresh tokens
	createRefreshTokenID: () => Promise<T>
	saveRefreshToken: SaveUserTokenFunction<T>
	// TODO: we don't need the token from storage, we just need to know if it is not invalidated
	isRefreshTokenValid: (id: T, familyID: T) => Promise<boolean>
	getRefreshToken: (id: T, familyID: T) => Promise<string | undefined>
	invalidateRefreshToken: (id: T, familyID: T) => Promise<void>
	invalidateRefreshTokenFamily: (familyID: T) => Promise<void>
	// access tokens
	saveAccessToken?: SaveUserTokenFunction<T>
	invalidateAccessToken?:  (id: T, familyID: T) => Promise<void>
	invalidateAccessTokenFamily?: (familyID: T) => Promise<void>
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
