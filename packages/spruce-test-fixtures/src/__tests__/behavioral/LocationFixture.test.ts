import { test, assert } from '@sprucelabs/test'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import { DEMO_NUMBER_LOCATION_FIXTURE } from '../../tests/constants'

export default class LocationFixtureTest extends AbstractSpruceFixtureTest {
	@test()
	protected static async canCreateWithSpecificOrg() {
		const org = await this.Fixture('organization').seedDemoOrganization({
			name: 'Location fixture org',
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
		})

		const location = await this.Fixture('location').seedDemoLocation({
			name: 'Location fixture location',
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
			organizationId: org.id,
		})

		assert.isEqual(org.id, location.organizationId)
	}
}
