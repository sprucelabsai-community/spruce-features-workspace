import { SettingsService, Skill, SkillFeature } from '@sprucelabs/spruce-skill-utils'
import { ViewHealthCheckItem } from '../types/view.types'

export class ViewFeature implements SkillFeature {
	private skill: Skill

	public constructor(skill: Skill) {
		this.skill = skill
	}

	public async execute(): Promise<void> {}
	public async checkHealth(): Promise<ViewHealthCheckItem> {
		
		return {
			status: 'passed',
			skillViewControllers: [],
			viewControllers: []
		}
	}

	public async isInstalled(): Promise<boolean> {
		const settings = new SettingsService(this.skill.rootDir)
		return settings.isMarkedAsInstalled('view')
	}

	public async destroy() {}

	public isBooted() {
		return false
	}
}

export default (skill: Skill) => {
	const feature = new ViewFeature(skill)
	skill.registerFeature('view', feature)
}
