import { errorAssertUtil } from '@sprucelabs/test-utils'
import { test, assert } from '@sprucelabs/test'
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
	protected static async skillIsKilledDifferentFeatureCrash() {
		const skill = await this.SkillFromTestDir('registered-skill-boot-events')

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

		await assert.doesThrowAsync(() => skill.execute())
	}
}
