import { test, assert } from '@sprucelabs/test'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import fake from '../../../tests/decorators/fake'

@fake.login()
export default class FakingAuthenticatorTest extends AbstractSpruceFixtureTest {
	@test()
	protected static async canCreateFakingAuthenticator() {
		const auth = this.views.getAuthenticator()
		assert.isEqualDeep(auth.getPerson(), this.fakedPerson)
	}
}
