import { test, assert } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import fake from '../../../tests/decorators/fake'

@fake.login()
export default class DisablingPermissionsInTestsTest extends AbstractSpruceFixtureTest {
	@test()
	protected static async disablesPermissionsAtStart() {
		assert.isEqual(process.env.SHOULD_REGISTER_PERMISSIONS, 'false')
	}
}
