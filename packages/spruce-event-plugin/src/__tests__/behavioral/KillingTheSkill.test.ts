import { test, assert } from '@sprucelabs/test'
import { EventFeaturePlugin } from '../../plugins/event.plugin'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'

export default class KillingTheSkillTest extends AbstractEventPluginTest {
	@test.only()
	protected static async killingSkillDisconnectsClient() {
		const skill = this.Skill()
		void skill.execute()
		const plugin = skill.getFeatureByCode('event') as EventFeaturePlugin

		const client = await plugin.connectToApi()

		assert.isTruthy(client)
		assert.isTrue(client.isConnected())

		await skill.kill()

		assert.isFalse(client.isConnected())
	}
}
