const config = require('config')

const i18nextConfig = config.get('passportJwtWrapper.i18next')

module.exports = {
	input: [
		'src/**/*.ts',
	],
	output: './',
	options: {
		debug: false,
		func: {
			list: ['i18next.t', 't'],
			extensions: ['.ts', '.ejs']
		},
		sort: true,
		trans: false,
		removeUnusedKeys: true,
		lngs: i18nextConfig.preload,
		ns: i18nextConfig.ns,
		defaultLng: i18nextConfig.fallbackLng,
		defaultNs: i18nextConfig.defaultNS,
		defaultValue(lng, _ns, key) {
			// set default value to key for en language
			if (lng === 'en') {
				return key
			}

			return '_NOT_TRANSLATED_'
		},
		resource: {
			loadPath: i18nextConfig.backend.loadPath,
			savePath: 'locales/{{lng}}/{{ns}}.json',
			jsonIndent: i18nextConfig.backend.jsonIndent,
			lineEnding: '\n'
		},
		nsSeparator: i18nextConfig.nsSeparator,
		keySeparator: i18nextConfig.keySeparator
	}
}
