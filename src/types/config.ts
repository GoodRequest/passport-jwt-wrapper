import { JwtFromRequestFunction } from 'passport-jwt'
import { IStrategyOptionsWithRequest } from 'passport-local'

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
	local: IStrategyOptionsWithRequest
	jwt: IJWTPassportConfig
}
