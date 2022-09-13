import { test, assert } from '@sprucelabs/test-utils'
import { errorAssert } from '@sprucelabs/test-utils'
import AbstractGraphicsInterfaceTest from '../../../tests/AbstractGraphicsInterfaceTest'

export default class MessageGraphicsInterfaceTest extends AbstractGraphicsInterfaceTest {
	@test()
	protected static async selectAsksAgainWithBadResponse() {
		const promise = this.ui.prompt({
			type: 'select',
			label: 'What would you like to do?',
			isRequired: true,
			options: {
				choices: [
					{
						label: 'Book appointment',
						value: 'bookAppointment',
					},
					{
						label: 'Cancel appointment',
						value: 'cancelAppointment',
					},
				],
			},
		})

		await this.sendMessage('get me out of here!')

		const err = await assert.doesThrowAsync(async () => await promise)
		errorAssert.assertError(err, 'ABORT')
	}
}
