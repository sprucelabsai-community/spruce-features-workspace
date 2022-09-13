import { test, assert } from '@sprucelabs/test-utils'
import AbstractConversationTest from '../../tests/AbstractConversationTest'

export default class KillingASkillTest extends AbstractConversationTest {
	@test()
	protected static async killingASkillKillsConversation() {
		this.cwd = this.resolveTestPath('empty-skill')
		const { skill } = await this.bootAndRegisterNewSkill({
			name: 'great skill dude!',
		})

		await skill.kill()

		assert.isFalse(skill.isRunning())
	}
}
