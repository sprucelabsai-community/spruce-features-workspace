import { AuthorizerFactory } from '@sprucelabs/spruce-permission-utils'
import { test, assert } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import fake from '../../../tests/decorators/fake'

@fake.login()
export default class PermissionFixtureTest extends AbstractSpruceFixtureTest {
	@test()
	protected static async disablesPermissionsAtStart() {
		assert.isEqual(process.env.SHOULD_REGISTER_PERMISSIONS, 'false')
	}

	@test()
	protected static async permissionFixtureShouldUseSharedInstance() {
		const actual = this.permissions.getAuthorizer()
		const expected = AuthorizerFactory.getInstance()
		assert.isEqual(actual, expected)
	}
}
