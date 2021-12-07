import { diskUtil, Skill } from '@sprucelabs/spruce-skill-utils'
import { test, assert } from '@sprucelabs/test'
import { EventFeaturePlugin } from '../../plugins/event.plugin'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'

export default class EventPluginTest extends AbstractEventPluginTest {
	private static skill: Skill
	private static events: EventFeaturePlugin

	protected static async beforeEach() {
		await super.beforeEach()

		await this.registerSkill()
		this.skill = await this.SkillFromTestDir('skill-boot-events')

		this.skill = await this.Skill()
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

	private static async registerSkill() {
		const registeredSkill = await this.Fixture('skill').seedDemoSkill({
			name: 'my great skill',
		})

		process.env.SKILL_ID = registeredSkill.id
		process.env.SKILL_API_KEY = registeredSkill.apiKey

		return registeredSkill
	}
}
