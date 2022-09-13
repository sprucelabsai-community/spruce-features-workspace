import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import fake from '../../../tests/decorators/fake'

@fake.login()
export default class UsingFakesOnIncompatibleClassTest extends AbstractSpruceTest {
	@test()
	protected static async shouldNotCrash() {
		assert.isTrue(true)
	}
}
