import { HealthCheckItem } from '@sprucelabs/spruce-skill-utils'

export interface StoreHealthCheckItem extends HealthCheckItem {
	stores: string[]
}

declare module '@sprucelabs/spruce-skill-utils/build/types/skill.types' {
	interface HealthCheckResults {
		store?: StoreHealthCheckItem
	}
}
