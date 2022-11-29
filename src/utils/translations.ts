const delimiter = ':'
// eslint-disable-next-line import/prefer-default-export
export function customTFunction(key: string) {
	if (key.includes(delimiter)) {
		const splitted = key.split(delimiter)
		return splitted.slice(1).join(delimiter)
	}

	return key
}
