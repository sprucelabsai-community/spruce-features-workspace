import { test, assert } from '@sprucelabs/test'
import { errorAssertUtil } from '@sprucelabs/test-utils'
import AbstractConversationTest from '../../tests/AbstractConversationTest'
import ScriptTester, { END_OF_LINE } from '../../tests/ScriptTester'
import { Script } from '../../types/conversation.types'

export default class ScriptTesterTest extends AbstractConversationTest {
	@test()
	protected static async throwsWithoutScript() {
		//@ts-ignore
		const err = await assert.doesThrowAsync(() => ScriptTester.Tester())
		errorAssertUtil.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['script'],
		})
	}

	@test()
	protected static async acceptsSimpleScript() {
		const tester = await ScriptTester.Tester({
			topics: [
				{
					key: 'bookAppointment',
					label: 'Book appointment',
					script: ['hey there!'],
				},
			],
		})
		assert.isTruthy(tester)
	}

	@test()
	protected static async callingGoDoesntCrash() {
		const tester = await ScriptTester.Tester({
			topics: [
				{
					key: 'bookAppointment',
					label: 'Book appointment',
					script: ['hey there!'],
				},
			],
			writeHandler: () => {},
		})

		void tester.go()
	}

	@test()
	protected static async cantHandleMessageBeforeStartup() {
		const tester = await ScriptTester.Tester({
			topics: [
				{
					key: 'bookAppointment',
					label: 'Book appointment',
					script: ['hey there!'],
				},
			],
			writeHandler: () => {},
		})

		const err = await assert.doesThrowAsync(() => tester.handleInput('taco'))

		errorAssertUtil.assertError(err, 'TESTER_NOT_STARTED')
	}

	@test()
	protected static async selectingBadScriptToStartThrows() {
		const tester = await ScriptTester.Tester({
			topics: ScriptTesterTest.basicBookingScript,
			selectPromptHandler: async () => {
				return 'oeuou'
			},
			writeHandler: () => {},
		})

		const err = await assert.doesThrowAsync(() => tester.go())

		errorAssertUtil.assertError(err, 'TOPIC_NOT_FOUND', {
			suppliedTopic: 'oeuou',
			validTopics: ['bookAppointment', 'cancelAppointment'],
		})
	}

	private static readonly basicBookingScript = [
		{
			key: 'bookAppointment',
			label: 'Book appointment',
			script: ['you ready to book?'],
		},
		{
			key: 'cancelAppointment',
			label: 'Cancel appointment',
			script: ['Lets cancel'],
		},
	]

	@test()
	protected static async asksWhichScriptYouWantToStartWithWhenThereIsMoreThanOne() {
		let choices: any
		const writes: string[] = []
		const tester = await ScriptTester.Tester({
			topics: ScriptTesterTest.basicBookingScript,
			selectPromptHandler: async (message) => {
				choices = message.choices ?? []
				return 'cancelAppointment'
			},
			writeHandler: (message) => {
				writes.push(message.body)
			},
		})

		void tester.go('go team')

		assert.isEqualDeep(choices, [
			{
				value: 'bookAppointment',
				label: 'Book appointment',
			},
			{
				value: 'cancelAppointment',
				label: 'Cancel appointment',
			},
		])

		await this.wait(10)

		assert.doesInclude(writes, 'Lets cancel')
	}

	@test('plays single line script', ['hey there'])
	@test('plays multi line script', ['hey there', 'how are you?'])
	protected static async playsSimpleScript(script: Script) {
		const writes: string[] = []
		const tester = await ScriptTester.Tester({
			shouldPlayReplayAfterFinish: false,
			lineDelay: 0,
			topics: [{ key: 'test', label: 'Testing', script }],
			writeHandler: (message) => {
				writes.push(message.body)
			},
		})

		assert.isLength(writes, 0)

		void tester.go('hey there!')

		await this.wait(10)

		const expected = [...script, END_OF_LINE]

		assert.isLength(writes, expected.length)
		assert.isEqualDeep(writes, expected)
	}

	@test('passes the confirm', 'yes')
	@test('fails the confirm', 'no')
	protected static async canSendInputToThePlayer(answer: string) {
		const writes: string[] = []
		const tester = await ScriptTester.Tester({
			shouldPlayReplayAfterFinish: false,
			topics: [
				{
					key: 'test',
					label: 'Test with prompt',
					script: [
						async (options) => {
							const confirm = await options.ui.confirm('Are you sure?')

							if (confirm) {
								options.ui.renderLine('yes')
							} else {
								options.ui.renderLine('no')
							}
						},
					],
				},
			],
			writeHandler: (message) => {
				writes.push(message.body)
			},
			promptHandler: async () => {
				return answer
			},
		})

		void tester.go('lets go!')

		await this.wait(10)
		const expected = ['Are you sure?', answer, END_OF_LINE]
		assert.isEqualDeep(writes, expected)
	}

	@test()
	protected static async promptsForFirstMessageIfNoneSentToGo() {
		const writes: string[] = []
		const promptWrites: string[] = []
		let promptResolve: any

		const tester = await ScriptTester.Tester({
			lineDelay: 0,
			topics: [
				{
					key: 'test',
					label: 'Test with prompt',
					script: ['go', 'team'],
				},
			],
			writeHandler: (message) => {
				writes.push(message.body)
			},
			promptHandler: async (message) => {
				promptWrites.push(message.body)
				await new Promise((resolve) => (promptResolve = resolve))
				return 'answer from prompt'
			},
		})

		void tester.go()

		await this.wait(10)

		assert.isLength(promptWrites, 1)

		assert.isLength(writes, 0)

		promptResolve()

		await this.wait(10)

		const expected = ['go', 'team', END_OF_LINE]

		assert.isEqualDeep(writes, expected)
	}

	@test()
	protected static async promptsToStartAgainAfterDone() {
		const writes: string[] = []
		let promptHitCount = 0
		const tester = await ScriptTester.Tester({
			lineDelay: 0,
			topics: [
				{
					key: 'test',
					label: 'Test with prompt',
					script: ['go', 'team'],
				},
			],
			writeHandler: (message) => {
				writes.push(message.body)
			},
			promptHandler: async () => {
				promptHitCount++
				if (promptHitCount > 2) {
					await new Promise(() => {})
				}
				return 'answer from prompt'
			},
		})

		void tester.go()

		await this.wait(500)

		assert.isEqual(promptHitCount, 3)

		assert.isEqualDeep(writes, [
			'go',
			'team',
			END_OF_LINE,
			'go',
			'team',
			END_OF_LINE,
		])
	}
}
