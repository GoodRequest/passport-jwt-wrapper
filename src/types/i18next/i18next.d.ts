// https://github.com/i18next/react-i18next/issues/1559
import 'i18next'

declare module 'i18next' {
	interface CustomTypeOptions {
		returnNull: false
	}
}
