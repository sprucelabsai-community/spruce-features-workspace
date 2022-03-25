import { test, assert } from '@sprucelabs/test'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import fake from '../../../tests/decorators/fake'
import seed from '../../../tests/decorators/seed'

@fake.login()
export default class FakingInBeforeEachTest extends AbstractSpruceFixtureTest {
	@seed('locations', 1)
	protected static async beforeEach(): Promise<void> {
		await super.beforeEach()
	}

	@test()
	protected static async canGetLocations() {
		assert.isLength(this.fakedLocations, 1)
	}
}
