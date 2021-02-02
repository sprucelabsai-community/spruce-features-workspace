import { test, assert } from '@sprucelabs/test'
import { errorAssertUtil } from '@sprucelabs/test-utils'
import { ConversationFeature } from '../../plugins/conversation.plugin'
import AbstractConversationTest from '../../tests/AbstractConversationTest'

export default class TestingAConversationTest extends AbstractConversationTest {
	@test()
	protected static async bootingNormallyDoesNotGoToTestMode() {
		const conversation = await this.bootAndGetConversationFeature()

		assert.isFalse(conversation.isTesting())
		this.clearSkillBootErrors()
	}

	@test()
	protected static async bootsInTestModeWithProperAction() {
		process.env.ACTION = 'test.conversation'
		const conversation = await this.bootAndGetConversationFeature()

		assert.isTrue(conversation.isTesting())
	}

	@test()
	protected static async throwsWithBadScript() {
		this.cwd = this.resolveTestPath('bad-skill')
		process.env.ACTION = 'test.conversation'
		const skill = this.Skill()

		const err = await assert.doesThrowAsync(() => skill.execute())

		errorAssertUtil.assertError(err, 'INVALID_TOPIC')
	}

	private static async bootAndGetConversationFeature() {
		const skill = await this.bootSkill()
		const conversation = skill.getFeatureByCode(
			'conversation'
		) as ConversationFeature

		return conversation
	}
}
