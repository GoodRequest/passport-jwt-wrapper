export enum MESSAGE_TYPE {
	ERROR = 'ERROR',
	WARNING = 'WARNING',
	SUCCESS = 'SUCCESS',
	INFO = 'INFO'
}

interface IErrorBuilderItem {
	message: string
	type: string
	path?: string
}

const prepareErrorItems = (name: string) => {
	return [{
		type: MESSAGE_TYPE.ERROR,
		message: name
	}]
}

export class ErrorBuilder extends Error {
	status: number
	items: IErrorBuilderItem[]

	constructor(status: number, name: string) {
		super(JSON.stringify(name))
		this.status = status
		this.items = prepareErrorItems(name)
	}
}
