import Skill from '@sprucelabs/spruce-skill-utils'
import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import plugin from './../../plugins/event.plugin'

export default class CheckingHealthTest extends AbstractSpruceTest {
	@test()
	protected static async pluginReturnsInstance() {
		assert.isTrue(plugin instanceof Function)
	}

	@test()
	protected static registersWithSkill() {
		const skill = this.Skill()
		const features = skill.getFeatures()
		assert.isLength(features, 1)
	}

	@test()
	protected static returnsEmptyHealthCheck() {
		const skill = this.Skill()
		
	}

	protected static Skill(options?: { activeDir?: string }) {
		const skill = new Skill({
			rootDir: this.cwd,
			activeDir: this.cwd,
			hashSpruceDir: this.cwd,
			...options,
		})
		plugin(skill)
		return skill
	}
}
