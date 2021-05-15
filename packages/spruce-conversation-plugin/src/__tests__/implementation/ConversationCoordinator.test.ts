import { test, assert } from '@sprucelabs/test'
import { errorAssertUtil } from '@sprucelabs/test-utils'
import { ConversationCoordinator } from '../../conversations/ConversationCoordinator'
import AbstractConversationTest from '../../tests/AbstractConversationTest'
import { SendMessage } from '../../types/conversation.types'

export default class TopicCoordinatorTest extends AbstractConversationTest {
	private static coordinator: ConversationCoordinator
	private static sentMessages: SendMessage[] = []
	protected static async beforeEach() {
		await super.beforeEach()

		this.sentMessages = []

		this.coordinator = await ConversationCoordinator.Coordinator({
			lineDelay: 0,
			sendMessageHandler: async (message) => {
				this.sentMessages.push(message)
			},
			topicLookupPath: this.resolveTestPath('skill', 'build'),
		})
	}

	@test()
	protected static async canCreateTopicCoordinator() {
		assert.isTruthy(this.coordinator)
	}

	@test()
	protected static async hasHandleMessage() {
		assert.isFunction(this.coordinator.handleMessage)
	}

	@test()
	protected static async handledMessageMustHaveASource() {
		const err = await assert.doesThrowAsync(() =>
			this.coordinator.handleMessage(this.buildMessage({ body: 'waka waka' }))
		)

		errorAssertUtil.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['source.personId'],
		})
	}

	@test()
	protected static async respondsWithSuggestedTopicsToFirstMessage() {
		const results = await this.coordinator.handleMessage(
			this.buildMessage({ body: 'help me book!', source: { personId: '1234' } })
		)

		assert.isArray((results as any).suggestedTopics)
		assert.isLength((results as any).suggestedTopics, 3)
	}

	@test()
	protected static async handlesNoSkillWithTopics() {
		const coordinator = await ConversationCoordinator.Coordinator({
			topicLookupPath: this.cwd,
			sendMessageHandler: async () => {},
		})

		const results = await coordinator.handleMessage(
			this.buildMessage({ body: 'help me book!', source: { personId: '1234' } })
		)

		assert.isArray((results as any).suggestedTopics)
		assert.isLength((results as any).suggestedTopics, 0)
	}

	@test()
	protected static async throwsWhenSentBadTopic() {
		const err = await assert.doesThrowAsync(() =>
			this.coordinator.handleMessage(
				this.buildMessage({ body: '1', source: { personId: '1234' } }),
				'aoeu'
			)
		)

		errorAssertUtil.assertError(err, 'TOPIC_NOT_FOUND', {
			suppliedTopic: 'aoeu',
			validTopics: [
				'bookAppointment',
				'cancelAppointment',
				'favoriteColor',
				'favoriteColorTopicChanger',
				'mixedStringsAndCallbacks',
			],
		})
	}

	@test()
	protected static async playsScriptWhenTopicIsSelected() {
		await this.coordinator.handleMessage(
			this.buildMessage({ body: '1', source: { personId: '1234' } }),
			'bookAppointment'
		)

		assert.isLength(this.sentMessages, 2)
		assert.isEqual(this.sentMessages[0].body, 'Sweet, lets book!')
	}

	@test()
	protected static async canHandlePromptsInScript() {
		void this.coordinator.handleMessage(
			this.buildMessage({ body: '1', source: { personId: '1234' } }),
			'favoriteColor'
		)

		await this.wait(10)

		assert.isLength(this.sentMessages, 1)
		assert.isEqual(this.sentMessages[0].body, 'what is your favorite color?')

		void this.coordinator.handleMessage(
			this.buildMessage({ body: 'blue', source: { personId: '1234' } }),
			'favoriteColor'
		)

		await this.wait(10)

		assert.isLength(this.sentMessages, 2)
		assert.isEqual(this.sentMessages[this.sentMessages.length - 1].body, 'blue')

		void this.coordinator.handleMessage(
			this.buildMessage({ body: 'blue', source: { personId: '1234' } }),
			'bookAppointment'
		)

		await this.wait(10)

		assert.isLength(this.sentMessages, 4)
		assert.isEqual(
			this.sentMessages.pop()?.body,
			'Lemme find your appointment!'
		)
	}

	@test()
	protected static async canPlaceMixedScriptsUntilTheEndAndStartsOver() {
		await this.coordinator.handleMessage(
			this.buildMessage({ body: '1', source: { personId: '1234' } }),
			'mixedStringsAndCallbacks'
		)

		await this.wait(10)

		assert.isLength(this.sentMessages, 2)
		assert.isEqual(this.sentMessages[0]?.body, 'string 1')
		assert.isEqual(this.sentMessages[1]?.body, 'prompt 1')

		this.sentMessages = []

		await this.coordinator.handleMessage(
			this.buildMessage({ body: 'answer 1', source: { personId: '1234' } }),
			'mixedStringsAndCallbacks'
		)

		await this.wait(100)

		assert.isLength(this.sentMessages, 3)
		assert.isEqual(this.sentMessages[0]?.body, 'answer 1')
		assert.isEqual(this.sentMessages[1]?.body, 'string 2')
		assert.isEqual(this.sentMessages[2]?.body, 'prompt 2')

		this.sentMessages = []

		await this.coordinator.handleMessage(
			this.buildMessage({ body: 'answer 2', source: { personId: '1234' } }),
			'mixedStringsAndCallbacks'
		)

		assert.isLength(this.sentMessages, 2)
		assert.isEqual(this.sentMessages[0]?.body, 'answer 2')
		assert.isEqual(this.sentMessages[1]?.body, 'and done')

		this.sentMessages = []

		await this.coordinator.handleMessage(
			this.buildMessage({ body: 'answer 1', source: { personId: '1234' } }),
			'mixedStringsAndCallbacks'
		)

		await this.wait(100)

		assert.isLength(this.sentMessages, 2)
		assert.isEqual(this.sentMessages[0]?.body, 'string 1')
		assert.isEqual(this.sentMessages[1]?.body, 'prompt 1')
	}
}
