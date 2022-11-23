// eslint-disable-next-line import/prefer-default-export
export function customTFunction(key: string) {
	const splitted = key.split(':')
	return splitted.slice(1).join(':')
}
