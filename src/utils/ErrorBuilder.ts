import Joi from 'joi'

import { MESSAGE_TYPE } from './enums'

const prepareErrorItems = (name: string | Joi.ValidationErrorItem[]) => {
	if (!Array.isArray(name)) {
		return [
			{
				type: MESSAGE_TYPE.ERROR,
				message: name
			}
		]
	}

	return name?.map((item: Joi.ValidationErrorItem) => ({
		type: MESSAGE_TYPE.ERROR,
		path: item.path.join('.'),
		message: item.message
	}))
}

interface IErrorBuilderItem {
	message: string
	type: string
	path?: string
}

// eslint-disable-next-line import/prefer-default-export
export class ErrorBuilder extends Error {
	status: number
	isJoi: boolean
	items: IErrorBuilderItem[]

	constructor(status: number, name: string | Joi.ValidationErrorItem[]) {
		super(JSON.stringify(name))
		this.status = status
		this.isJoi = typeof name !== 'string'
		this.items = prepareErrorItems(name)
	}
}
