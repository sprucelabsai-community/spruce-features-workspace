import { test, assert } from '@sprucelabs/test'
import plugin from '../../plugins/view.plugin'
import AbstractViewTest from '../../tests/AbstractViewTest'

export default class CheckingHealthTest extends AbstractViewTest {
	@test()
	protected static async pluginReturnsInstance() {
		assert.isTruthy(plugin instanceof Function)
	}

	@test()
	protected static async isNotInHealthCheckIfNotInstalled() {
		const skill = await this.SkillFromTestDir('empty-skill')
		const health = await skill.checkHealth()

		assert.isFalsy(health.view)
	}
	
	@test()
	protected static async healthCheckReturnsNoViewsToStart() {
		const skill = await this.SkillFromTestDir('installed-skill')
		const health = await skill.checkHealth()

		assert.isTruthy(health.view)
		assert.isArray(health.view.skillViewControllers)
		assert.isLength(health.view.skillViewControllers,0)
		assert.isArray(health.view.viewControllers)
		assert.isLength(health.view.viewControllers,0)

	}

	@test()
	protected static async canLoadViewControllers() {
		const skill = await this.SkillFromTestDir('skill')
		const health = await skill.checkHealth()

		assert.isTruthy(health.view)
		assert.isLength(health.view.skillViewControllers,1)
	}

	
}
