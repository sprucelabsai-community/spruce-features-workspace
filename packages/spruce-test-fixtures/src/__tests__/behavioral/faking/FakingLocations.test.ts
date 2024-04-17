import { test, assert } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import fake from '../../../tests/decorators/fake'
import seed from '../../../tests/decorators/seed'

@fake.login()
export default class FakingLocationsTest extends AbstractSpruceFixtureTest {
    @test()
    @seed('locations', 1)
    @seed('organizations', 1)
    @seed('locations', 1)
    protected static async listingLocationsWithoutTargetGetsAllLocations() {
        const locations = await this.emitListLocations()
        assert.isEqualDeep(locations, this.fakedLocations)
    }

    @test()
    protected static async seededLocationsComeBackInDateCreatedDescOrder() {
        const location1 = await this.locations.seedDemoLocation({})

        const location2 = await this.locations.seedDemoLocation({})
        const location3 = await this.locations.seedDemoLocation({})

        const locations = await this.emitListLocations()

        assert.isEqualDeep(locations, [location3, location2, location1])
    }

    private static async emitListLocations() {
        const [{ locations }] = await this.fakedClient.emitAndFlattenResponses(
            'list-locations::v2020_12_25'
        )

        return locations
    }
}
