import { MercuryClientFactory } from '@sprucelabs/mercury-client'
import { TestBootOptions } from '@sprucelabs/spruce-skill-booter'
import { Skill, SkillContext } from '@sprucelabs/spruce-skill-utils'
import { test, assert } from '@sprucelabs/test-utils'
import { errorAssert } from '@sprucelabs/test-utils'
import { ConversationFeature } from '../../plugins/conversation.plugin'
import AbstractConversationTest from '../../tests/AbstractConversationTest'

export default class TestingAConversationTest extends AbstractConversationTest {
	protected static async afterEach() {
		await super.afterEach()
		process.env.ACTION = undefined
	}

	protected static async afterAll() {
		await super.afterAll()
		process.env.ACTION = undefined
	}

	@test()
	protected static async bootingNormallyDoesNotGoToTestMode() {
		this.cwd = this.resolveTestPath('empty-skill')
		const conversation = await this.bootAndGetConversationFeature({
			shouldSuppressBootErrors: true,
		})

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
		const skill = await this.Skill()
		const err = await assert.doesThrowAsync(() => skill.execute())

		errorAssert.assertError(err, 'INVALID_TOPIC')
	}

	@test()
	protected static async throwsWithThrowsInScript() {
		this.cwd = this.resolveTestPath('skill-with-script-that-throws')
		process.env.ACTION = 'test.conversation'
		process.env.FIRST_MESSAGE = 'hey there!'
		const skill = await this.Skill()

		const err = await assert.doesThrowAsync(() => skill.execute())

		errorAssert.assertError(err, 'CONVERSATION_ABORTED')
	}

	@test('can get context 1', { hello: 'world' })
	@test('can get context 2', { what: 'the!?' })
	protected static async scriptTesterGetsContext(context: SkillContext) {
		this.cwd = this.resolveTestPath('skill-with-one-topic')

		MercuryClientFactory.setIsTestMode(true)
		process.env.ACTION = 'test.conversation'
		process.env.FIRST_MESSAGE = 'hey there!'

		const skill = await this.Skill()
		const getContext = () => context
		//@ts-ignore
		skill.getContext = getContext

		void this.bootSkill({ skill })
		await this.wait(100)

		const scriptTester = await this.getScriptTester(skill)
		//@ts-ignore
		scriptTester.writeHandler = () => {}

		//@ts-ignore
		const player = scriptTester.player
		assert.isTruthy(player)

		//@ts-ignore
		assert.isEqualDeep(player.getContext(), context)

		await skill.kill()
	}

	private static async getScriptTester(skill: Skill) {
		const conversation = this.getConversationFeature(skill)
		//@ts-ignore
		while (!conversation.tester) {
			await this.wait(100)
		}

		//@ts-ignore
		const scriptTester = conversation.tester
		assert.isTruthy(scriptTester)

		return scriptTester
	}

	private static async bootAndGetConversationFeature(
		options?: TestBootOptions
	) {
		const { skill } = await this.bootSkill(options)

		const conversation = this.getConversationFeature(skill)

		return conversation
	}

	private static getConversationFeature(skill: Skill) {
		return skill.getFeatureByCode('conversation') as ConversationFeature
	}
}
