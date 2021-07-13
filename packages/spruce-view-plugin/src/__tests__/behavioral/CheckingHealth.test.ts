import { test, assert } from '@sprucelabs/test'
import plugin from '../../plugins/view.plugin'
import AbstractViewPluginTest from '../../tests/AbstractViewPluginTest'

export default class CheckingHealthTest extends AbstractViewPluginTest {
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
		assert.isLength(health.view.skillViewControllers, 0)
		assert.isArray(health.view.viewControllers)
		assert.isLength(health.view.viewControllers, 0)
	}

	@test()
	protected static async canLoadViewControllers() {
		const skill = await this.SkillFromTestDir('skill')
		const health = await skill.checkHealth()

		assert.isTruthy(health.view)
		assert.isFalsy(health.view.errors)
		assert.isLength(health.view.skillViewControllers, 2)
		assert.doesInclude(health.view.skillViewControllers, { id: 'book' })
		assert.doesInclude(health.view.skillViewControllers, { id: 'spy' })
		assert.isFalsy(health.view.skillViewControllers[0].error)

		assert.isLength(health.view.viewControllers, 1)
		assert.doesInclude(health.view.viewControllers, { id: 'book-form' })
	}

	@test()
	protected static async helpfulErrorIfVcIsBroken() {
		const skill = await this.SkillFromTestDir('broken-skill')
		const health = await skill.checkHealth()

		assert.isTruthy(health.view)
		assert.isTruthy(health.view.errors)
		assert.isTruthy(health.view.viewControllers[0].error)
		assert.doesInclude(
			health.view.viewControllers[0].error.message,
			'BookFormViewController'
		)
	}
}
