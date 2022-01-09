import { assert, test } from '@sprucelabs/test'
import { AbstractSpruceFixtureTest, login, seed } from '../..'
import { DEMO_NUMBER_ACCOUNT_AFTER_ALL_RESET } from '../../tests/constants'

@login(DEMO_NUMBER_ACCOUNT_AFTER_ALL_RESET)
export default class ResettingAccountAfterAllTestsTest extends AbstractSpruceFixtureTest {
	protected static async afterAll() {
		await super.afterAll()

		const orgs = await this.organizations.listOrganizations()
		assert.isLength(orgs, 0)
	}

	@test()
	@seed('organizations', 1)
	protected static async nothing() {}
}

//@ts-ignore
ResettingAccountAfterAllTestsTest.cwd = process.cwd()
void ResettingAccountAfterAllTestsTest.Fixture(
	'organization'
).seedDemoOrganization({
	name: 'Outside of test',
	phone: DEMO_NUMBER_ACCOUNT_AFTER_ALL_RESET,
})
