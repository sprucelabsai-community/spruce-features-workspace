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
		const [{ locations }] = await this.fakedClient.emitAndFlattenResponses(
			'list-locations::v2020_12_25'
		)

		assert.isEqualDeep(locations, this.fakedLocations)
	}
}
