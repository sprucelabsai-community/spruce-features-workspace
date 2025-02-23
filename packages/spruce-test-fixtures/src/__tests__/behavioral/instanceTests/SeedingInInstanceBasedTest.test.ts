import { test, assert, suite } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import fake from '../../../tests/decorators/fake'
import seed from '../../../tests/decorators/seed'

@fake.login()
@suite()
export default class SeedingInInstanceBasedTestTest extends AbstractSpruceFixtureTest {
    @test()
    protected gettingSeededBeforeSeedingThrows() {
        assert.doesThrow(() => this.fakedLocations)
    }

    @seed('locations', 1)
    @test()
    protected async canCreateSeedingInInstanceBasedTest() {
        assert.isLength(this.fakedLocations, 1)
    }
}
