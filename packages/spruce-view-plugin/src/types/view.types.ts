import { HealthCheckItem } from '@sprucelabs/spruce-skill-utils'

export interface HealthCheckView {
	name: string
}

export interface ViewHealthCheckItem extends HealthCheckItem {
	views: HealthCheckView[]
}

declare module '@sprucelabs/spruce-skill-utils/build/types/skill.types' {
	export interface HealthCheckResults {
		view?: ViewHealthCheckItem
	}
}
