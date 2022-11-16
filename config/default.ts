import { ExtractJwt } from 'passport-jwt'

import { IPassportConfig } from '../src'

export default {
	i18next: {
		preload: ['en', 'de'],
		fallbackLng: 'en',
		ns: ['translation', 'error', 'success', 'email'],
		defaultNS: 'translation',
		detection: {
			order: ['header']
		},
		backend: {
			loadPath: 'locales/{{lng}}/{{ns}}.json',
			jsonIndent: 2
		}
	},
	passport: <IPassportConfig>{
		local: {
			usernameField: 'email',
			passwordField: 'password',
			session: false,
			passReqToCallback: true
		},
		jwt: {
			secretOrKey: process.env.JWT_SECRET,
			api: {
				exp: '1h',
				jwtFromRequest: ExtractJwt.fromExtractors(
					[ExtractJwt.fromAuthHeaderAsBearerToken(), ExtractJwt.fromUrlQueryParameter('t')]),
				refresh: {
					exp: '30d'
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
}
