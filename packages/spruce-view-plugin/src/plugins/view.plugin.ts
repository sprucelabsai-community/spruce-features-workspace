import { Skill, SkillFeature } from '@sprucelabs/spruce-skill-utils'
import { ViewHealthCheckItem } from '../types/view.types'

export class ViewFeature implements SkillFeature {
	private _isBooted = false

	public constructor() {}

	public async execute(): Promise<void> {}
	public async checkHealth(): Promise<ViewHealthCheckItem> {
		return {
			status: 'passed',
			views: [],
		}
	}

	public async isInstalled(): Promise<boolean> {
		return false
	}

	public async destroy() {}

	public isBooted() {
		return this._isBooted
	}
}

export default (skill: Skill) => {
	const feature = new ViewFeature()
	skill.registerFeature('view', feature)
}
