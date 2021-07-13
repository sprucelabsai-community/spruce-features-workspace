import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'

class Routing {}

export default class RoutingTest extends AbstractSpruceTest {
	@test()
	protected static async canCreateRouting() {
		const routing = new Routing()
		assert.isTruthy(routing)
	}

	@test()
	protected static async yourNextTest() {
		assert.isTrue(false)
	}
}
