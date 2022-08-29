import { fake } from '@sprucelabs/spruce-test-fixtures'
import { test, assert } from '@sprucelabs/test'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'

@fake.login()
export default class FakingAuthenticatorTest extends AbstractSpruceFixtureTest {
	@test()
	protected static async canCreateFakingAuthenticator() {
		const auth = this.views.getAuthenticator()
		assert.isEqualDeep(auth.getPerson(), this.fakedPerson)
	}
}
