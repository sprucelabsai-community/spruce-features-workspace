import { test, assert } from '@sprucelabs/test'
import AbstractConversationTest from '../../tests/AbstractConversationTest'

export default class KillingASkillTest extends AbstractConversationTest {
	@test()
	protected static async canCreateKillingASkill() {
		const skill = await this.bootSkill()

		await skill.kill()

		assert.isFalse(skill.isRunning())
	}
}
