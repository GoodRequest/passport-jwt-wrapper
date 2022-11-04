import { MESSAGE_TYPE } from './enums'

const prepareErrorItems = (name: string) => {
	return [
		{
			type: MESSAGE_TYPE.ERROR,
			message: name
		}
	]
}

interface IErrorBuilderItem {
	message: string
	type: string
	path?: string
}

// eslint-disable-next-line import/prefer-default-export
export class ErrorBuilder extends Error {
	status: number
	items: IErrorBuilderItem[]

	constructor(status: number, name: string) {
		super(JSON.stringify(name))
		this.status = status
		this.items = prepareErrorItems(name)
	}
}
