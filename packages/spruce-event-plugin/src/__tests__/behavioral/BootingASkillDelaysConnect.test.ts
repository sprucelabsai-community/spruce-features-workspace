import { Skill } from '@sprucelabs/spruce-skill-utils'
import { fake } from '@sprucelabs/spruce-test-fixtures'
import { assert, test } from '@sprucelabs/test-utils'
import ListenerCacher from '../../cache/ListenerCacher'
import { EventFeaturePlugin } from '../../plugins/event.plugin'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'
import { DEMO_NUMBER_DELAYED_CONNECT } from '../../tests/constants'

@fake.login()
export default class BootingASkillDelaysConnectTest extends AbstractEventPluginTest {
	private static currentSkill: Skill
	protected static async beforeEach() {
		await super.beforeEach()
		const skill = await this.skills.seedDemoSkill({
			creatorPhone: DEMO_NUMBER_DELAYED_CONNECT,
		})

		const currentSkill = await this.Skill()

		process.env.SKILL_ID = skill.id
		process.env.SKILL_API_KEY = skill.apiKey

		this.currentSkill = currentSkill

		await this.mercury.connectToApi()
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

	private static async bootSkillAndConnect() {
		ListenerCacher.setHaveListenersChanged(false)

		const events = this.currentSkill.getFeatureByCode(
			'event'
		) as EventFeaturePlugin

		await this.bootSkill({ skill: this.currentSkill })

		const client = await events.connectToApi()
		return client
	}
}
