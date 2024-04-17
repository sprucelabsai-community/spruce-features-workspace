import { test, assert } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import fake from '../../../tests/decorators/fake'
import seed from '../../../tests/decorators/seed'

@fake.login()
export default class FakingInBeforeEachTest extends AbstractSpruceFixtureTest {
    @seed('locations', 1)
    protected static async beforeEach(): Promise<void> {
        await super.beforeEach()
    }

    @test()
    protected static async canGetLocations() {
        assert.isLength(this.fakedLocations, 1)
    }

    @test()
    @seed('organizations', 1)
    protected static async canGetRolesForBothSeededOrgs() {
        const matches = this.fakedRoles.filter(
            (r) => r.organizationId === this.fakedOrganizations[0].id
        )

        const matches2 = this.fakedRoles.filter(
            (r) => r.organizationId === this.fakedOrganizations[1].id
        )

        assert.isEqual(matches.length, matches2.length)
    }
}
