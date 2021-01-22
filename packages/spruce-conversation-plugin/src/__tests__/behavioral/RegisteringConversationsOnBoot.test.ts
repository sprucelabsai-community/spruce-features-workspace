import { EventFeature } from '@sprucelabs/spruce-event-plugin'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { test, assert } from '@sprucelabs/test'
import { errorAssertUtil } from '@sprucelabs/test-utils'
import plugin from '../../plugins/conversation.plugin'
import AbstractConversationTest from '../../tests/AbstractConversationTest'

export default class RegisteringConversationsOnBootTest extends AbstractConversationTest {
	@test()
	protected static async throwsWhenExecutingIfEventPluginMissing() {
		const skill = this.Skill({ plugins: [plugin] })
		const err = await assert.doesThrowAsync(() => skill.execute())

		errorAssertUtil.assertError(err, 'MISSING_DEPENDENCIES', {
			dependencies: ['event.plugin'],
		})
	}

	@test()
	protected static async noConvosToStart() {
		const topics = await this.boot()

		assert.isLength(topics, 0)
	}

	@test()
	protected static async registersConvosOnBoot() {
		this.cwd = this.resolveTestPath('skill')

		const topics = await this.boot()

		this.assert2ExpectedTopics(topics)
	}

	@test()
	protected static async canBootASecondTime() {
		this.cwd = this.resolveTestPath('skill')

		const topics = await this.boot(2)

		this.assert2ExpectedTopics(topics)

		const topics2 = await this.boot(2, {
			skillId: process.env.SKILL_ID as string,
			apiKey: process.env.SKILL_API_KEY as string,
		})

		this.assert2ExpectedTopics(topics2)
	}

	private static assert2ExpectedTopics(topics: any) {
		assert.isLength(topics, 2)

		assert.doesInclude(topics, { key: 'bookAppointment' })
		assert.doesInclude(topics, { key: 'cancelAppointment' })
	}

	private static async boot(
		minTopics = 0,
		options?: { skillId: string; apiKey: string }
	) {
		if (options?.skillId) {
			process.env.SKILL_ID = options.skillId
			process.env.SKILL_API_KEY = options.apiKey
		} else {
			const registeredSkill = await this.Fixture('skill').seedDemoSkill({
				name: 'my great skill',
			})

			process.env.SKILL_ID = registeredSkill.id
			process.env.SKILL_API_KEY = registeredSkill.apiKey
		}

		const skill = this.Skill()

		void skill.execute()

		const eventFeature = skill.getFeatureByCode('event') as EventFeature

		const { client } = await eventFeature.connectToApi()

		let topics: any

		do {
			await this.wait(1000)
			const results = await client.emit('get-conversation-topics::v2020_12_25')
			const payload = eventResponseUtil.getFirstResponseOrThrow(results)
			topics = payload.topics
		} while (topics.length < minTopics)

		return topics
	}
}
