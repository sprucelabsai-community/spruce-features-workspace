import { test, assert } from '@sprucelabs/test-utils'
import AbstractGraphicsInterfaceTest from '../../../tests/AbstractGraphicsInterfaceTest'

export default class MessageGraphicsInterfaceTest extends AbstractGraphicsInterfaceTest {
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
}
