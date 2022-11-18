export interface DomainSet {
	get isValid(): boolean

	get isPositive(): boolean
}

export class Domain<ValueType, EnumType> {
	value: ValueType
	properties: EnumType[]
	isValid: boolean
	isPositive: boolean

	constructor(value: ValueType, properties: EnumType[], isValid: boolean, isPositive: boolean) {
		this.value = value
		this.properties = properties
		this.isValid = isValid
		this.isPositive = isPositive
	}
}
