export interface DomainSet<DomainSetPropertyType> {
	isValid: boolean
	isPositive: boolean

	properties: DomainSetPropertyType[]
}

export class DomainStorage<DomainSetPropertyType, DomainType extends DomainSet<DomainSetPropertyType>> {
	private positiveValues: DomainType[] = []
	private negativeValues: DomainType[] = []
	private invalidValues: DomainType[] = []

	constructor(values: DomainType[]) {
		values.forEach((value) => {
			if (value.isPositive && value.isValid) {
				this.positiveValues.push(value)
			} else if (value.isValid) {
				this.negativeValues.push(value)
			} else {
				this.invalidValues.push(value)
			}
		})
	}

	getPositiveValue(properties: DomainSetPropertyType[] = []): DomainType | undefined {
		return this.positiveValues.find((value) => properties.every((prop) => value.properties.includes(prop)))
	}

	getAllPositiveValues(): DomainType[] {
		return this.positiveValues
	}

	getNegativeUser(properties: DomainSetPropertyType[] = []): DomainType | undefined {
		return this.negativeValues.find((user) => properties.every((prop) => user.properties.includes(prop)))
	}

	getAllNegativeValues(): DomainType[] {
		return this.negativeValues
	}

	getInvalidUser(properties: DomainSetPropertyType[] = []): DomainType | undefined {
		return this.invalidValues.find((user) => properties.every((prop) => user.properties.includes(prop)))
	}

	getAllInvalidValues(): DomainType[] {
		return this.invalidValues
	}
}
