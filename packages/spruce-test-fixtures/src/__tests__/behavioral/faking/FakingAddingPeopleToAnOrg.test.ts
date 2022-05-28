import { test, assert } from '@sprucelabs/test'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import fake from '../../../tests/decorators/fake'
import seed from '../../../tests/decorators/seed'

@fake.login()
export default class FakingAddingPeopleToAnOrgTest extends AbstractSpruceFixtureTest {
	@test()
	@seed('organizations', 1)
	@seed('owners', 1)
	protected static async canCreateFakingAddingPeopleToAnOrg() {
		assert.isLength(this.fakedOwners, 2)
	}
}
