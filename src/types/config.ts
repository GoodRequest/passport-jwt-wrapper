import { IStrategyOptionsWithRequest } from 'passport-local'

interface JWTConfig {
	exp: string
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
