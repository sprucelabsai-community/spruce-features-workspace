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
		const skill = await this.skills.seedDemoSkill({
			creatorPhone: DEMO_NUMBER_DELAYED_CONNECT,
		})

		const currentSkill = await this.Skill()

		process.env.SKILL_ID = skill.id
		process.env.SKILL_API_KEY = skill.apiKey

		this.currentSkill = currentSkill
		this.registeredSkill = skill

		await this.mercury.connectToApi()
	}

	@test()
	protected static async afterBootStillNotConnected() {
		const client = await this.bootSkillAndConnect()

		//@ts-ignore
		assert.isFalse(client.isConnectedToApi)

		const results = await client.emit('whoami::v2020_12_25')

		//@ts-ignore
		assert.isTrue(client.isConnectedToApi)

		const { auth } = eventResponseUtil.getFirstResponseOrThrow(results)

		assert.isEqual(auth.skill?.id, this.registeredSkill.id)
	}

	private static async bootSkillAndConnect() {
		ListenerCacher.setHaveListenersChanged(false)

		const events = this.currentSkill.getFeatureByCode(
			'event'
		) as EventFeaturePlugin

		await this.bootSkill({ skill: this.currentSkill })
		const client = await events.connectToApi()
		return client
	}

	@test()
	protected static async emittingAlwaysWaitsForFirstDelayedConnectToAuthenticate() {
		const client = await this.bootSkillAndConnect()

		const all = await Promise.all([
			client.emit('whoami::v2020_12_25'),
			client.emit('whoami::v2020_12_25'),
			client.emit('whoami::v2020_12_25'),
			client.emit('whoami::v2020_12_25'),
			client.emit('whoami::v2020_12_25'),
		])

		for (const response of all) {
			assert.isEqual(response.responses[0].payload?.type, 'authenticated')
		}
	}
}
