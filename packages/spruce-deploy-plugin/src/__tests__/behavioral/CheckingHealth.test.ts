import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'

export default class CheckingHealthTest extends AbstractSpruceTest {
	@test()
	protected static async canCreateCheckingHealth() {
		assert.isTruthy(true)
	}
}
