import { assert, test } from '@sprucelabs/test'
import AbstractFakeDecoratorTest from '../../support/AbstractFakeDecoratorTest'

export default class FakeDecoratorTest extends AbstractFakeDecoratorTest {
	@test()
	protected static async setsPersonToClass() {
		const auth = await this.fakeLoginAndGetAuth()
		assert.isEqualDeep(this.fakedPerson, auth.person)
	}
}
