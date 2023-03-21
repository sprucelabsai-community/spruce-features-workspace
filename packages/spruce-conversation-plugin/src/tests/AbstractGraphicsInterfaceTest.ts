import { GraphicsInterface } from '@sprucelabs/spruce-skill-utils'
import MessageGraphicsInterface from '../interfaces/MessageGraphicsInterface'
import { ScriptPlayerSendMessage } from '../types/conversation.types'
import AbstractConversationTest from './AbstractConversationTest'

export default abstract class AbstractGraphicsInterfaceTest extends AbstractConversationTest {
	protected static sentMessages: ScriptPlayerSendMessage[]
	protected static ui: GraphicsInterface

	protected static async beforeEach() {
		await super.beforeEach()

		this.sentMessages = []

		this.ui = new MessageGraphicsInterface({
			invalidValueRepairs: ['invalid-value-repair', 'invalid-value-repair2'],
			sendMessageHandler: async (message) => {
				this.sentMessages.push(message)
			},
		})
	}

	protected static async afterEach() {
		await super.afterEach()
		;(this.ui as MessageGraphicsInterface).destroy()
	}

	protected static async sendMessage(body: string) {
		await (this.ui as MessageGraphicsInterface).handleMessageBody(body)
	}
}
