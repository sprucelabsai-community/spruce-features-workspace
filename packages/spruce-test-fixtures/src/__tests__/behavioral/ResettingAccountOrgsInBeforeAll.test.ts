import { assert, test } from '@sprucelabs/test-utils'
import FakerTracker from '../../FakerTracker'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import { DEMO_NUMBER_ACCOUNT_BEFORE_ALL_RESET } from '../../tests/constants'
import login from '../../tests/decorators/login'
import seed from '../../tests/decorators/seed'
import MercuryFixture from '../../tests/fixtures/MercuryFixture'

MercuryFixture.setShouldRequireLocalListeners(false)

@login(DEMO_NUMBER_ACCOUNT_BEFORE_ALL_RESET)
export default class ResettingAccountBeforeAllTestsTest extends AbstractSpruceFixtureTest {
    protected static async beforeAll(): Promise<void> {
        await this.wait(5000)
        await super.beforeAll()
    }

    @test()
    protected static async delayToGivesSeederTimeToWrite() {
        await this.wait(1000)
    }

    @test()
    protected static async shouldHaveNoOrgs() {
        const orgs = await this.listOrgs()
        assert.isLength(orgs, 0)
    }

    @test()
    @seed('organizations', 1)
    protected static async nothing() {}

    private static async listOrgs() {
        return await this.organizations.listOrganizations()
    }
}

//@ts-ignore
FakerTracker.setCwd(process.cwd())
void FakerTracker.fixtures.organizations.seedDemoOrganization({
    name: 'Outside of test',
    phone: DEMO_NUMBER_ACCOUNT_BEFORE_ALL_RESET,
})
