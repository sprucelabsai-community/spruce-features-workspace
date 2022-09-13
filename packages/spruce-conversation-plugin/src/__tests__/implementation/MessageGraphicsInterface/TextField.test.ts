import { test, assert } from '@sprucelabs/test-utils'
import AbstractGraphicsInterfaceTest from '../../../tests/AbstractGraphicsInterfaceTest'

export default class TextFieldTest extends AbstractGraphicsInterfaceTest {
	@test()
	protected static async promptSendsLabel() {
		void this.ui.prompt({
			type: 'text',
			label: 'Tell me about your life.',
		})

		assert.doesInclude(this.sentMessages, { body: 'Tell me about your life.' })
	}

	@test()
	protected static async noPromptSendsNoMessage() {
		void this.ui.prompt({
			type: 'text',
		})

		assert.isLength(this.sentMessages, 0)
	}

	@test()
	protected static async canRespondToPrompt() {
		const promise = this.ui.prompt({
			type: 'text',
		})

		await this.sendMessage('hey there!')

		const answer = await promise

		assert.isEqual(answer, 'hey there!')
	}
}
