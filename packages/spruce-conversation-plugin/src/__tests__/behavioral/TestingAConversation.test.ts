import { test, assert } from '@sprucelabs/test'
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

	private static async bootAndGetConversationFeature() {
		const skill = await this.bootSkill()
		const conversation = skill.getFeatureByCode(
			'conversation'
		) as ConversationFeature

		return conversation
	}
}
