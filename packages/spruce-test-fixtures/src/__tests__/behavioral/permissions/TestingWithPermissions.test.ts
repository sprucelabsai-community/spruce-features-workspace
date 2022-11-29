import { fake } from '@sprucelabs/spruce-test-fixtures'
import { test, assert } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'

@fake.login()
export default class DisablingPermissionsInTestsTest extends AbstractSpruceFixtureTest {
	@test()
	protected static async disablesPermissionsAtStart() {
		assert.isEqual(process.env.SHOULD_REGISTER_PERMISSIONS, 'false')
	}
}
