import { GraphicsInterface } from '@sprucelabs/spruce-skill-utils'
import { test, assert } from '@sprucelabs/test'
import { errorAssertUtil } from '@sprucelabs/test-utils'
import MessageGraphicsInterface from '../../../interfaces/MessageGraphicsInterface'
import AbstractConversationTest from '../../../tests/AbstractConversationTest'
import { ScriptPlayerSendMessage } from '../../../types/conversation.types'

export default class MessageGraphicsInterfaceTest extends AbstractConversationTest {
	private static sentMessages: ScriptPlayerSendMessage[]
	private static ui: GraphicsInterface

	protected static async beforeEach() {
		this.sentMessages = []

		this.ui = new MessageGraphicsInterface({
			invalidValueRepairs: ['invalid-value-repair', 'invalid-value-repair2'],
			sendMessageHandler: async (message) => {
				this.sentMessages.push(message)
			},
		})
	}

	@test()
	protected static async selectAsksAgainWithBadResponse() {
		const promise = this.renderAppointmentSelect()

		await this.sendMessage('get me out of here!')

		const err = await assert.doesThrowAsync(async () => await promise)
		errorAssertUtil.assertError(err, 'ABORT')
	}

	@test()
	protected static async respondingWithNumberSelectsOptions() {
		const promise = this.renderAppointmentSelect()

		await this.sendMessage('1')

		const results = await promise

		assert.isEqual(results, 'bookAppointment')
	}

	@test()
	protected static async respondingWithBadNumberAsksYouToSelectAgain() {
		void this.renderAppointmentSelect()

		await this.sendMessage('5')

		await this.sendMessage('5')

		assert.doesInclude(this.sentMessages, { body: 'invalid-value-repair' })
		assert.doesInclude(this.sentMessages, { body: 'invalid-value-repair2' })

		const last = this.sentMessages.pop()

		assert.isTruthy(last?.choices)
	}

	@test()
	protected static async respondingWithCloseMatchSelectsChoice() {
		const promise = this.renderAppointmentSelect()

		await this.sendMessage('book please')

		const selection = await promise

		assert.isEqual(selection, 'bookAppointment')
	}

	private static renderAppointmentSelect() {
		const choices = [
			{
				label: 'Book appointment',
				value: 'bookAppointment',
			},
			{
				label: 'Cancel appointment',
				value: 'cancelAppointment',
			},
		]

		const response = this.ui.prompt({
			type: 'select',
			label: 'What would you like to do?',
			isRequired: true,
			options: {
				choices,
			},
		})

		assert.doesInclude(this.sentMessages, {
			body: 'What would you like to do?',
			choices,
		})
		return response
	}

	private static async sendMessage(body: string) {
		await (this.ui as MessageGraphicsInterface).handleMessageBody(body)
	}
}
