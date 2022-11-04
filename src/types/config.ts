import { JwtFromRequestFunction } from 'passport-jwt'
import { IStrategyOptions } from 'passport-local'

interface JWTConfig {
	exp: string
	jwtFromRequest: JwtFromRequestFunction
}

interface IJWTPassportConfig {
	secretOrKey: string
	api: {
		refresh: {
			exp: string
		}
	} & JWTConfig
	passwordReset: JWTConfig
	invitation: JWTConfig
}

export interface IPassportConfig {
	local: IStrategyOptions
	jwt: IJWTPassportConfig
}
