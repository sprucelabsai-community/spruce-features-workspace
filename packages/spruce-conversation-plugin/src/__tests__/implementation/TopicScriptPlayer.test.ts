import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import { errorAssertUtil } from '@sprucelabs/test-utils'
import { TopicScriptPlayer } from '../../conversations/TopicScriptPlayer'
import {
	Script,
	ScriptPlayerOptions,
	SendMessage,
	Message,
} from '../../types/conversation.types'

export default class TopicScriptPlayerTest extends AbstractSpruceTest {
	@test()
	protected static async throwsWhenRequiredOptionsNotSent() {
		//@ts-ignore
		const err = assert.doesThrow(() => new TopicScriptPlayer())
		errorAssertUtil.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['script', 'sendMessageHandler', 'target.personId'],
		})
	}

	@test()
	protected static async respondsToMessageWithOnlyLineInScript() {
		const messages: SendMessage[] = []

		const player = this.Player({
			script: ['It all started on a cold, dark night.'],
			target: { personId: '12345' },
			sendMessageHandler: async (message) => {
				messages.push(message)
			},
		})

		await this.sendMessage(player, {
			body: 'how are you today?',
		})

		assert.isLength(messages, 1)
		assert.isEqual(messages[0].body, 'It all started on a cold, dark night.')
		assert.isEqualDeep(messages[0].target.personId, '12345')
	}

	@test()
	protected static async respondsToMessagesWithAllLinesInScript() {
		const messages: SendMessage[] = []

		const player = this.Player({
			script: [
				'It all started on a cold, dark night.',
				'Before the sun went down',
			],
			sendMessageHandler: async (message) => {
				messages.push(message)
			},
		})

		await this.sendMessage(player, {
			body: 'how are you today?',
		})

		assert.isLength(messages, 2)
		assert.isEqual(messages[0].body, 'It all started on a cold, dark night.')
		assert.isEqual(messages[1].body, 'Before the sun went down')
	}

	@test()
	protected static async restartsScriptNextMessage() {
		const messages: SendMessage[] = []

		const player = this.Player({
			script: [
				'It all started on a cold, dark night.',
				'Before the sun went down',
			],
			sendMessageHandler: async (message) => {
				messages.push(message)
			},
		})

		await this.sendMessage(player, {
			body: 'how are you today?',
		})

		await this.sendMessage(player, {
			body: 'how are you today?',
		})

		assert.isLength(messages, 4)
	}

	@test()
	protected static async responseWithRandomLine() {
		const messages: SendMessage[] = []

		const player = this.Player({
			script: [['one', 'two', 'three']],
			sendMessageHandler: async (message) => {
				messages.push(message)
			},
		})

		const remaining = { one: 1, two: 1, three: 1 }

		do {
			await this.sendMessage(player, {
				body: 'how are you today?',
			})

			if (messages.length === 0) {
				assert.fail("Didn't send any message.")
			}

			//@ts-ignore
			delete remaining[messages.pop().body]
		} while (Object.keys(remaining).length > 0)
	}

	@test()
	protected static async renderLineSendsMessage() {
		const messages: SendMessage[] = []

		const player = this.Player({
			script: [
				async (options) => {
					options.ui.renderLine('What the?')
				},
			],
			sendMessageHandler: async (message) => {
				messages.push(message)
			},
		})

		await this.sendMessage(player, {
			body: 'What the?',
		})
	}

	@test('Passes confirm when sent "Y"', 'Y', true)
	@test('Passes confirm when sent "y"', 'y', true)
	@test('Passes confirm when sent "yes"', 'yes', true)
	@test('Passes confirm when sent "yup"', 'yup', true)
	@test('Passes confirm when sent "yes please"', 'yes please', true)
	@test('Passes confirm when sent "yeah"', 'yeah', true)
	@test('Passes confirm when sent "yeah!!!"', 'yeah!!!', true)
	@test('Passes confirm when sent "oh heck ya"', 'oh heck ya', true)
	@test('Passes confirm when sent "oh heck yeah"', 'oh heck yeah', true)
	@test('Passes confirm when sent "👍"', '👍', true)
	@test('Fails confirm when sent "negative"', 'negative', false)
	@test('Fails confirm when sent "nope"', 'nope', false)
	@test('Fails confirm when sent "nope!!"', 'nope!!', false)
	@test('Fails confirm when sent "no"', 'no', false)
	@test('Fails confirm when sent "no thanks"', 'no thanks', false)
	@test('Fails confirm when sent "no thank you"', 'no thank you', false)
	@test('Fails confirm when sent "nah"', 'nah', false)
	@test('Fails confirm when sent "No thanks!!!"', 'No thanks!!!', false)
	@test('Fails confirm when sent "👎"', '👎', true)
	protected static async scriptCanAskToConfirm(
		confirmBody: string,
		expectedConfirmResults: boolean
	) {
		let confirmStarted = false
		let confirmResponse: boolean | undefined
		let confirmFinished = false
		const messages: SendMessage[] = []

		const player = this.Player({
			sendMessageHandler: async (message) => {
				messages.push(message)
			},
			script: [
				'It all started on a cold, dark night.',
				'Before the sun went down',
				async (options) => {
					confirmStarted = true

					const confirm = await options.ui.confirm('Are you sure?')

					confirmResponse = confirm
					confirmFinished = true
				},
			],
		})

		void this.sendMessage(player, {
			body: 'tell me a story!',
		})

		await this.wait(100)

		assert.isTrue(confirmStarted)
		assert.isUndefined(confirmResponse)
		assert.isFalse(confirmFinished)

		await this.sendMessage(player, {
			body: confirmBody,
		})

		await this.wait(100)

		assert.isTrue(confirmStarted)
		assert.isEqual(confirmResponse, expectedConfirmResults)
		assert.isTrue(confirmFinished)

		assert.doesInclude(messages, { body: 'Are you sure?' })
	}

	private static Player(
		options: Partial<ScriptPlayerOptions> & { script: Script }
	) {
		return new TopicScriptPlayer({
			target: options.target ?? { personId: '12345' },
			script: options.script,
			sendMessageHandler: options.sendMessageHandler ?? async function () {},
		})
	}

	private static async sendMessage(
		player: TopicScriptPlayer,
		message: Partial<SendMessage>
	) {
		await player.handleMessage(
			this.buildMessage({ source: { personId: '1234' }, ...message })
		)
	}

	protected static buildMessage<T extends Partial<Message>>(
		values: T
	): Message & T {
		return {
			id: '1234',
			dateCreated: new Date().getTime(),
			target: {},
			source: {},
			classification: 'incoming',
			...values,
		} as Message & T
	}
}
