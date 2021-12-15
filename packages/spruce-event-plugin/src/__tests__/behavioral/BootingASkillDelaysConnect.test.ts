import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { Skill } from '@sprucelabs/spruce-skill-utils'
import { assert, test } from '@sprucelabs/test'
import ListenerCacher from '../../cache/ListenerCacher'
import { EventFeaturePlugin } from '../../plugins/event.plugin'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'
import { DEMO_NUMBER_DELAYED_CONNECT } from '../../tests/constants'

export default class BootingASkillDelaysConnectTest extends AbstractEventPluginTest {
	private static currentSkill: Skill
	private static registeredSkill: SpruceSchemas.Spruce.v2020_07_22.Skill
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
		this.registeredSkill = skill

		await this.Fixture('mercury').connectToApi()
	}

	@test()
	protected static async afterBootStillNotConnected() {
		ListenerCacher.setHaveListenersChanged(false)

		const events = this.currentSkill.getFeatureByCode(
			'event'
		) as EventFeaturePlugin

		await this.bootSkill({ skill: this.currentSkill })
		const client = await events.connectToApi()

		//@ts-ignore
		assert.isFalse(client.isConnectedToApi)

		const results = await client.emit('whoami::v2020_12_25')

		//@ts-ignore
		assert.isTrue(client.isConnectedToApi)

		const { auth } = eventResponseUtil.getFirstResponseOrThrow(results)

		assert.isEqual(auth.skill?.id, this.registeredSkill.id)
	}
}
