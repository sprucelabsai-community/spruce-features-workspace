import { test, assert } from '@sprucelabs/test'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import fake from '../../../tests/decorators/fake'

@fake.login()
export default class FakingInBeforeEachTest extends AbstractSpruceFixtureTest {
	@fake('locations', 1)
	protected static async beforeEach(): Promise<void> {
		await super.beforeEach()
	}

	@test()
	protected static async canGetLocations() {
		assert.isLength(this.fakedLocations, 1)
	}
}
