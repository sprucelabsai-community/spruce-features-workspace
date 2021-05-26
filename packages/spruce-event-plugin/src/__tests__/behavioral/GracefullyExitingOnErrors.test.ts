import { test, assert } from '@sprucelabs/test'
import { errorAssertUtil } from '@sprucelabs/test-utils'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'

export default class GracefullyExitingOnErrorsTest extends AbstractEventPluginTest {
	@test()
	protected static async skillIsKilledAfterAuthError() {
		this.cwd = this.resolveTestPath('skill')

		process.env.SKILL_ID = '234'
		process.env.SKILL_API_KEY = '234234'

		const skill = await this.bootSkill({ shouldSuppressBootErrors: true })

		const err = this.skillBootError

		this.clearSkillBootErrors()

		assert.isFalse(skill.isRunning())

		assert.isTruthy(err, "Skill didn't error as expected")
		errorAssertUtil.assertError(err, 'MERCURY_RESPONSE_ERROR')
	}

	@test()
	protected static async skillIsKilledWhenDifferentFeatureCrashes() {
		const skill = await this.SkillFromTestDir('registered-skill-boot-events')

		delete process.env.SKILL_ID
		delete process.env.SKILL_API_KEY

		void skill.registerFeature('test', {
			execute: async () => {
				await new Promise((r) => setTimeout(r, 1000))
				throw new Error('crash!')
			},
			checkHealth: async () => ({ status: 'passed' }),
			isInstalled: async () => true,
			isBooted: () => false,
			destroy: async () => {},
		})

		await assert.doesThrowAsync(() => skill.execute(), 'crash')
	}

	@test()
	protected static async throwsIfHostNotSet() {
		delete process.env.HOST
		const err = await assert.doesThrowAsync(() => this.bootSkill())
		errorAssertUtil.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['env.HOST'],
		})
	}
}
