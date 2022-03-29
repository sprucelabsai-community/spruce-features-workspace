import { fake } from '@sprucelabs/spruce-test-fixtures'
import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'

@fake.login()
export default class UsingFakesOnIncompatibleClassTest extends AbstractSpruceTest {
	@test()
	protected static async shouldNotCrash() {
		assert.isTrue(true)
	}
}
