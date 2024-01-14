import AbstractSpruceError from '@sprucelabs/error'
import { SkillViewController } from '@sprucelabs/heartwood-view-controllers'
import { HealthCheckItem } from '@sprucelabs/spruce-skill-utils'

export interface HealthCheckView {
	id: string
	error?: AbstractSpruceError
}

export interface ViewHealthCheckItem extends HealthCheckItem {
	viewControllers: HealthCheckView[]
	skillViewControllers: HealthCheckView[]
}

export type ArgsFromSvc<T> =
	T extends SkillViewController<infer R> ? R : Record<string, any>

declare module '@sprucelabs/spruce-skill-utils/build/types/skill.types' {
	export interface HealthCheckResults {
		view?: ViewHealthCheckItem
	}
}
