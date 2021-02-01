import { test, assert } from '@sprucelabs/test'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'
import plugin from './../../plugins/event.plugin'

export default class CheckingHealthTest extends AbstractEventPluginTest {
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
	protected static async doesNotComeBackFromHealthCheckUntilDeterminesInstalled() {
		this.cwd = __dirname
		const skill = this.Skill()
		const health = await skill.checkHealth()
		assert.isFalsy(health.event)
	}

	@test()
	protected static async givesBackEmptyHealthWhenInstalled() {
		const skill = this.Skill()
		const health = await skill.checkHealth()

		assert.isTruthy(health.event)
	}
}
