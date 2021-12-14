import { Skill } from '@sprucelabs/spruce-skill-utils'
import { assert, test } from '@sprucelabs/test'
import { EventFeaturePlugin } from '../../plugins/event.plugin'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'
import { DEMO_NUMBER_DELAYED_CONNECT } from '../../tests/constants'

export default class BootingASkillDelaysConnectTest extends AbstractEventPluginTest {
	private static currentSkill: Skill
	protected static async beforeEach() {
		await super.beforeEach()
		const fixture = this.Fixture('skill')
		const skill = await fixture.seedDemoSkill({
			creatorPhone: DEMO_NUMBER_DELAYED_CONNECT,
		})

		const currentSkill = await this.Skill()

		process.env.SKILL_ID = skill.id
		process.env.SKILL_API_KEY = skill.apiKey

		this.currentSkill = currentSkill
	}

	@test()
	protected static async afterBootStillNotConnected() {
		await this.bootSkill({ skill: this.currentSkill })

		const events = this.currentSkill.getFeatureByCode(
			'event'
		) as EventFeaturePlugin

		const client = await events.connectToApi()

		//@ts-ignore
		assert.isFalse(client.isConnectedToApi)
	}
}
