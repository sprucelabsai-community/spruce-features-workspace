import { test, assert } from '@sprucelabs/test'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import {
	DEMO_NUMBER_HIRING,
	DEMO_NUMBER_LOCATION_FIXTURE,
} from '../../tests/constants'

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

	@test()
	protected static async canCreatLocationWithNoParams() {
		const location = await this.Fixture('location').seedDemoLocation()
		assert.isTruthy(location)
	}

	@test()
	protected static async isNotPartOfLocationtoStart() {
		const people = this.Fixture('person')

		const org = await this.Fixture('organization').seedDemoOrganization({
			name: 'Location fixture org',
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
		})

		const locationFixture = this.Fixture('location')
		const location = await locationFixture.seedDemoLocation({
			name: 'Location fixture location',
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
			organizationId: org.id,
		})

		const { person } = await people.loginAsDemoPerson(DEMO_NUMBER_HIRING)

		const isHired = await locationFixture.isPartOfLocation(
			person.id,
			location.id
		)
		assert.isFalse(isHired)
	}

	@test()
	protected static async canAttachPersonToOrg() {
		const people = this.Fixture('person')
		const org = await this.Fixture('organization').seedDemoOrganization({
			name: 'Location fixture org',
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
		})

		const locationFixture = this.Fixture('location')
		const location = await locationFixture.seedDemoLocation({
			name: 'Location fixture location',
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
			organizationId: org.id,
		})

		const { person } = await people.loginAsDemoPerson(DEMO_NUMBER_HIRING)

		await locationFixture.addPerson({
			personId: person.id,
			organizationId: org.id,
			locationId: location.id,
			roleBase: 'guest',
		})

		const isHired = await locationFixture.isPartOfLocation(
			person.id,
			location.id
		)
		assert.isTrue(isHired)
	}
}
