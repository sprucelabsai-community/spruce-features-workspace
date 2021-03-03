import AbstractSpruceError from '@sprucelabs/error'
import { HealthCheckItem } from '@sprucelabs/spruce-skill-utils'

export interface StoreHealthCheckItem extends HealthCheckItem {
	stores: {
		name: string
		status: HealthCheckItem['status']
		errors?: AbstractSpruceError<any>[]
	}[]
}

declare module '@sprucelabs/spruce-skill-utils/build/types/skill.types' {
	interface HealthCheckResults {
		store?: StoreHealthCheckItem
	}
}
