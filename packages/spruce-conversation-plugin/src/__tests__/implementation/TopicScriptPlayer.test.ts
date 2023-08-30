import { SkillContext } from '@sprucelabs/spruce-skill-utils'
import { test, assert, generateId } from '@sprucelabs/test-utils'
import { errorAssert } from '@sprucelabs/test-utils'
import AbstractConversationTest from '../../tests/AbstractConversationTest'
import { TopicScriptPlayer } from '../../topics/TopicScriptPlayer'
import {
	Script,
	ScriptPlayerOptions,
	SendMessage,
} from '../../types/conversation.types'

export default class TopicScriptPlayerTest extends AbstractConversationTest {
	@test()
	protected static async throwsWhenRequiredOptionsNotSent() {
		//@ts-ignore
		const err = assert.doesThrow(() => new TopicScriptPlayer())
		errorAssert.assertError(err, 'MISSING_PARAMETERS', {
			parameters: [
				'script',
				'sendMessageHandler',
				'target.personId',
				'getContext',
			],
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
	protected static async multipleTextLinesWaitsForDelay() {
		const messages: SendMessage[] = []

		const player = this.Player({
			lineDelay: 50,
			script: [
				'It all started on a cold, dark night.',
				'Before the sun went down',
			],
			sendMessageHandler: async (message) => {
				messages.push(message)
			},
		})

		void this.sendMessage(player, {
			body: 'how are you today?',
		})

		assert.isLength(messages, 1)

		await this.wait(100)

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
	protected static async respondsWithRandomLine() {
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
					options.ui.renderLine('What is up?')
				},
			],
			sendMessageHandler: async (message) => {
				messages.push(message)
			},
		})

		await this.sendMessage(player, {
			body: 'What the?',
		})

		assert.isLength(messages, 1)
		assert.isEqual(messages[0].body, 'What is up?')
		//@ts-ignore
		assert.isFalsy(messages[0].target.isCore)
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

	@test()
	protected static async scriptCanRespondWithTransition() {
		const player = this.Player({
			script: [
				async () => {
					return { transitionConversationTo: 'greeting' }
				},
			],
		})

		const results = await this.sendMessage(player, {
			body: 'tell me a story!',
		})

		assert.isTruthy(results)
		assert.isTruthy(results.transitionConversationTo)
		assert.isEqual(results.transitionConversationTo, 'greeting')
	}

	@test()
	protected static async scriptCanRespondWithTransitionAInLaterLines() {
		const player = this.Player({
			script: [
				'Hey there!',
				async () => {},
				async () => {
					return { transitionConversationTo: 'greeting' }
				},
			],
		})

		const results = await this.sendMessage(player, {
			body: 'tell me a story!',
		})

		assert.isTruthy(results)
		assert.isTruthy(results.transitionConversationTo)
		assert.isEqual(results.transitionConversationTo, 'greeting')
	}

	@test()
	protected static async scriptCanRespondWithTransitionAInLaterLinesAfterAskingForInput() {
		const player = this.Player({
			script: [
				'Hey there!',
				async (options) => {
					await options.ui.prompt({ type: 'text', isRequired: true })
				},
				async () => {
					return { transitionConversationTo: 'greeting' }
				},
			],
		})

		await this.sendMessage(player, {
			body: 'tell me a story!',
		})

		const results = await this.sendMessage(player, {
			body: 'Yes!',
		})

		assert.isTruthy(results)
		assert.isTruthy(results.transitionConversationTo)
		assert.isEqual(results.transitionConversationTo, 'greeting')
	}

	@test()
	protected static async randomOnOptions() {
		const messages: string[] = []
		const remaining = { one: true, two: true, three: true }
		const possibilities: (keyof typeof remaining)[] = ['one', 'two', 'three']
		const player = this.Player({
			sendMessageHandler: async (message) => {
				messages.push(message.body)
			},
			script: [
				async (options) => {
					assert.isFunction(options.rand)

					const answer = options.rand(possibilities)

					//@ts-ignore
					delete remaining[answer]
				},
			],
		})
		do {
			await this.sendMessage(player, {
				body: 'tell me a story!',
			})
		} while (Object.keys(remaining).length > 0)
	}

	@test()
	protected static async randomOptionsRandomOnNotString() {
		const possibilities = [true, false]
		let answer: any

		const player = this.Player({
			script: [
				async (options) => {
					assert.isFunction(options.rand)

					answer = options.rand(possibilities)
				},
			],
		})

		await this.sendMessage(player, {
			body: 'go',
		})

		assert.isTrue(possibilities.includes(answer))
	}

	@test()
	protected static async retainsStateBetweenScriptLines() {
		const player = this.Player({
			script: [
				async (options) => {
					options.state.goTeam = true
				},
				async (options) => {
					assert.isTrue(options.state.goTeam)
				},
			],
		})

		await this.sendMessage(player, {
			body: 'tell me a story!',
		})
	}

	@test()
	protected static async retainsStateBetweenMessages() {
		let stateCount = 0
		const player = this.Player({
			script: [
				async (options) => {
					if (!options.state.count) {
						options.state.count = 1
					} else {
						options.state.count++
					}
				},
				async (options) => {
					options.state.count++

					stateCount = options.state.count
				},
			],
		})

		await this.sendMessage(player, {
			body: 'tell me a story!',
		})

		assert.isEqual(stateCount, 2)

		await this.sendMessage(player, { body: 'again, again!' })

		assert.isEqual(stateCount, 4)
	}

	@test()
	protected static async alwaysEndsWithRedirectToDiscovery() {
		let stateCount = 0
		const player = this.Player({
			script: [
				async (options) => {
					if (!options.state.count) {
						options.state.count = 1
					} else {
						options.state.count++
					}
				},
				async (options) => {
					options.state.count++

					stateCount = options.state.count
				},
			],
		})

		let results = await this.sendMessage(player, {
			body: 'tell me a story!',
		})

		assert.isEqual(results?.transitionConversationTo, 'discovery')

		assert.isEqual(stateCount, 2)

		results = await this.sendMessage(player, { body: 'again, again!' })
		assert.isEqual(results?.transitionConversationTo, 'discovery')

		assert.isEqual(stateCount, 4)
	}

	@test('can passe context 1', { skill: 'test' })
	@test('can passe context 2', { hello: 'world' })
	protected static async skillContextAvailableOnScriptLine(
		context: SkillContext
	) {
		let passedContext: Record<string, any> | undefined

		const player = this.Player({
			getContext: () => context,
			script: [
				async (options) => {
					passedContext = options.context
				},
			],
		})

		await this.sendMessage(player, {
			body: generateId(),
		})

		assert.isEqualDeep(passedContext, context)
	}

	private static Player(
		options: Partial<ScriptPlayerOptions> & { script: Script }
	) {
		return new TopicScriptPlayer({
			target: options.target ?? { personId: '12345' },
			lineDelay: 0,
			sendMessageHandler: options.sendMessageHandler ?? async function () {},
			getContext: () => ({}) as SkillContext,
			...options,
		})
	}

	private static async sendMessage(
		player: TopicScriptPlayer,
		message: Partial<SendMessage>
	) {
		return player.handleMessage(
			this.buildMessage({ source: { personId: '1234' }, ...message })
		)
	}
}
