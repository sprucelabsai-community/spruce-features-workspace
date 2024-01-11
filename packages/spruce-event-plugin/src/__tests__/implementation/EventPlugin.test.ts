import { diskUtil, Skill } from '@sprucelabs/spruce-skill-utils'
import { MercuryFixture } from '@sprucelabs/spruce-test-fixtures'
import { test, assert } from '@sprucelabs/test-utils'
import { EventFeaturePlugin } from '../../plugins/event.plugin'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'

MercuryFixture.setShouldRequireLocalListeners(false)

export default class EventPluginTest extends AbstractEventPluginTest {
	private static skill: Skill
	private static events: EventFeaturePlugin

	protected static async beforeEach() {
		await super.beforeEach()

		await this.registerSkill()
		this.skill = await this.SkillFromTestDir('skill-boot-events')
		this.events = this.skill.getFeatureByCode('event') as EventFeaturePlugin
	}

	@test(
		'pulls from package.json',
		`namespace-${Math.round(Math.random() * 100)}`
	)
	protected static async canGetNamespace(namespace: string) {
		diskUtil.writeFile(
			this.resolvePath('package.json'),
			JSON.stringify({
				skill: {
					namespace,
				},
			})
		)

		const actual = await this.events.getNamespace()
		assert.isEqual(actual, namespace)
	}

	@test()
	protected static async usesListenersEvenIfNotInstalled() {
		this.skill = await this.SkillFromTestDir(
			'skill-event-not-installed-did-boot-event'
		)

		await this.bootSkill({
			skill: this.skill,
		})

		assert.isEqual(process.env.DID_BOOT, 'true')
	}

	@test()
	protected static async featuresDoesNotFinishExecuteUntilKilledIfConnectedToApi() {
		const skill = await this.SkillFromTestDir('empty-skill')

		const events = new EventFeaturePlugin(skill)

		await events.connectToApi()

		let didFinish = false

		const promise = events.execute().then(() => {
			didFinish = true
		})

		await this.wait(1000)

		assert.isFalse(didFinish)

		await events.destroy()

		assert.isTrue(didFinish)

		await promise
	}

	private static async registerSkill() {
		const registeredSkill = await this.skills.seedDemoSkill({
			name: 'my great skill',
		})

		process.env.SKILL_ID = registeredSkill.id
		process.env.SKILL_API_KEY = registeredSkill.apiKey

		return registeredSkill
	}
}
