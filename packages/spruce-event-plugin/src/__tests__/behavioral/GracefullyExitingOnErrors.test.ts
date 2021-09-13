import '@sprucelabs/mercury-core-events'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import { test, assert } from '@sprucelabs/test'
import { errorAssertUtil } from '@sprucelabs/test-utils'
import { EventFeaturePlugin } from '../../plugins/event.plugin'
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
				await new Promise<void>((r) => setTimeout(r, 1000))
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

	@test()
	protected static async throwsWhenRegisteringBadContract() {
		this.cwd = await this.generateSkillFromTestPath(
			'registered-skill-bad-signature'
		)

		const { skill } = await this.Fixture('skill').loginAsDemoSkill({
			name: 'boot-events',
		})

		process.env.SKILL_ID = skill.id
		process.env.SKILL_API_KEY = skill.apiKey

		this.generateGoodContractFileForSkill(skill)
		this.setupListenersForEventsRegisteredBySkill(skill)

		const err = await assert.doesThrowAsync(() => this.bootSkill())

		errorAssertUtil.assertError(err, 'INVALID_PAYLOAD')
	}

	@test()
	protected static async throwsWhenRegisteringBadContractIgnoringBadListenerError() {
		this.cwd = await this.generateSkillFromTestPath(
			'registered-skill-bad-signature'
		)

		const { skill } = await this.Fixture('skill').loginAsDemoSkill({
			name: 'boot-events',
		})

		process.env.SKILL_ID = skill.id
		process.env.SKILL_API_KEY = skill.apiKey

		this.generateGoodContractFileForSkill(skill)
		this.setupListenersForEventsRegisteredBySkill(skill)

		const booted = await this.Skill()

		const events = booted.getFeatureByCode('event') as EventFeaturePlugin
		const client = await events.connectToApi()

		await client.on('unregister-events::v2020_12_25', async () => {
			await new Promise<void>((resolve) => setTimeout(resolve, 1000))

			return {}
		})

		const err = await assert.doesThrowAsync(() => booted.execute())
		errorAssertUtil.assertError(err, 'INVALID_PAYLOAD')
	}

	private static setupListenersForEventsRegisteredBySkill(skill: any) {
		diskUtil.moveDir(
			this.resolvePath('build/listeners/namespace'),
			this.resolvePath(`build/listeners/`, skill.slug)
		)
	}
}
