import AbstractSpruceError from '@sprucelabs/error'
import { HealthCheckItem } from '@sprucelabs/spruce-skill-utils'

export interface HealthCheckView {
	id: string
	error?: AbstractSpruceError
}

export interface ViewHealthCheckItem extends HealthCheckItem {
	viewControllers: HealthCheckView[]
	skillViewControllers: HealthCheckView[]
}

declare module '@sprucelabs/spruce-skill-utils/build/types/skill.types' {
	export interface HealthCheckResults {
		view?: ViewHealthCheckItem
	}
}
