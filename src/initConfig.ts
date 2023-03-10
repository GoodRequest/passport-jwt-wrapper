import { InitOptions } from 'i18next'
import { ExtractJwt } from 'passport-jwt'
import config from 'config'
import { IPassportConfig, LibConfig } from './types/config'

const i18nextConfig = <InitOptions>{
	preload: ['en', 'sk'],
	fallbackLng: 'en',
	ns: ['error', 'translation'],
	defaultNS: 'translation',
	detection: {
		order: ['header']
	},
	backend: {
		loadPath: 'locales/{{lng}}/{{ns}}.json',
		jsonIndent: 2
	},
	nsSeparator: ':',
	keySeparator: false,
	returnNull: false
}

const passportConfig = <IPassportConfig>{
	local: {
		usernameField: 'email',
		passwordField: 'password',
		session: false,
		passReqToCallback: true
	},
	jwt: {
		secretOrKey: process.env.JWT_SECRET,
		api: {
			exp: '15m',
			jwtFromRequest: ExtractJwt.fromExtractors([ExtractJwt.fromAuthHeaderAsBearerToken(), ExtractJwt.fromUrlQueryParameter('t')]),
			refresh: {
				exp: '4h'
			}
		},
		passwordReset: {
			exp: '4h',
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
		},
		invitation: {
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			exp: '30d'
		}
	}
}

if (config.has('passportJwtWrapper')) {
	if (!config.has('passportJwtWrapper.checkAccessToken')) {
		config.util.setModuleDefaults('passportJwtWrapper.checkAccessToken', false)
	}

	if (!config.has('passportJwtWrapper.i18next')) {
		config.util.setModuleDefaults('passportJwtWrapper.i18next', i18nextConfig)
	}

	if (!config.has('passportJwtWrapper.passport')) {
		config.util.setModuleDefaults('passportJwtWrapper.passport', passportConfig)
	}
} else {
	const defaultConfigs: Partial<LibConfig> = {
		checkAccessToken: false
	}

	if (config.has('i18next')) {
		defaultConfigs.i18next = config.get('i18next')
	} else {
		defaultConfigs.i18next = i18nextConfig
	}

	if (config.has('passport')) {
		defaultConfigs.passport = config.get('passport')
	} else {
		defaultConfigs.passport = passportConfig
	}

	config.util.setModuleDefaults('passportJwtWrapper', defaultConfigs)
}

console.log('initialized config')
