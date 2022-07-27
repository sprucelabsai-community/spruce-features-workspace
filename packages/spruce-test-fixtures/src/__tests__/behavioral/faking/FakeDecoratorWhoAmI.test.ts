import { assert, test } from '@sprucelabs/test'
import { DEMO_NUMBER_HIRING } from '../../../tests/constants'
import AbstractFakeDecoratorTest from '../../support/AbstractFakeDecoratorTest'

export default class FakeDecoratorTest extends AbstractFakeDecoratorTest {
	@test()
	protected static async fakesWhoAmI() {
		const number = DEMO_NUMBER_HIRING
		const auth = await this.fakeLoginAndGetAuth(number)

		assert.doesInclude(auth.person, {
			phone: number,
		})
	}
}
