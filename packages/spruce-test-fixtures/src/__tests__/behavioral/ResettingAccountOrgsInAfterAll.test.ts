import { assert, test } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import { DEMO_NUMBER_ACCOUNT_AFTER_ALL_RESET } from '../../tests/constants'
import login from '../../tests/decorators/login'
import seed from '../../tests/decorators/seed'
import MercuryFixture from '../../tests/fixtures/MercuryFixture'

MercuryFixture.setShouldRequireLocalListeners(false)

@login(DEMO_NUMBER_ACCOUNT_AFTER_ALL_RESET)
export default class ResettingAccountAfterAllTestsTest extends AbstractSpruceFixtureTest {
	protected static async afterAll() {
		await super.afterAll()

		const orgs = await this.organizations.listOrganizations(
			DEMO_NUMBER_ACCOUNT_AFTER_ALL_RESET
		)
		assert.isLength(orgs, 0)
	}

	@test()
	@seed('organizations', 1)
	protected static async seedMoar() {
		await this.organizations.seedDemoOrganization({
			phone: DEMO_NUMBER_ACCOUNT_AFTER_ALL_RESET,
		})
	}
}

//@ts-ignore
ResettingAccountAfterAllTestsTest.cwd = process.cwd()
void ResettingAccountAfterAllTestsTest.Fixture(
	'organization'
).seedDemoOrganization({
	name: 'Outside of test',
	phone: DEMO_NUMBER_ACCOUNT_AFTER_ALL_RESET,
})
