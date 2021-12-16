import { test, assert } from '@sprucelabs/test'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import {
	DEMO_NUMBER_LOCATION_FIXTURE,
	DEMO_NUMBER_LOCATION_FIXTURE_OUTSIDER,
} from '../../tests/constants'
import LocationFixture from '../../tests/fixtures/LocationFixture'
import OrganizationFixture from '../../tests/fixtures/OrganizationFixture'
import PersonFixture from '../../tests/fixtures/PersonFixture'

export default class LocationFixtureTest extends AbstractSpruceFixtureTest {
	private static orgFixture: OrganizationFixture
	private static locationFixture: LocationFixture
	private static personFixture: PersonFixture

	protected static async beforeEach() {
		await super.beforeEach()
		this.orgFixture = this.Fixture('organization')
		this.locationFixture = this.Fixture('location')
		this.personFixture = this.Fixture('person')

		const seedFixture = this.Fixture('seed')
		await seedFixture.resetAccount(DEMO_NUMBER_LOCATION_FIXTURE)
		await seedFixture.resetAccount(DEMO_NUMBER_LOCATION_FIXTURE_OUTSIDER)
	}

	@test()
	protected static async canCreateWithSpecificOrg() {
		const org = await this.orgFixture.seedDemoOrganization({
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
		const location = await this.Fixture('location').seedDemoLocation({
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
		})
		assert.isTruthy(location)
	}

	@test()
	protected static async isNotPartOfLocationtoStart() {
		const location = await this.locationFixture.seedDemoLocation({
			name: 'Location fixture location',
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
		})

		const { person } = await this.personFixture.loginAsDemoPerson(
			DEMO_NUMBER_LOCATION_FIXTURE_OUTSIDER
		)

		const isHired = await this.locationFixture.isPartOfLocation({
			personId: person.id,
			locationId: location.id,
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
		})

		assert.isFalse(isHired)
	}

	@test()
	protected static async canAttachPersonToOrg() {
		const org = await this.orgFixture.seedDemoOrganization({
			name: 'Location fixture org',
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
		})

		await this.orgFixture.seedDemoOrganization({
			name: 'Outside org',
			phone: DEMO_NUMBER_LOCATION_FIXTURE_OUTSIDER,
		})

		const location = await this.locationFixture.seedDemoLocation({
			name: 'Location fixture location',
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
			organizationId: org.id,
		})

		const { person } = await this.personFixture.loginAsDemoPerson(
			DEMO_NUMBER_LOCATION_FIXTURE_OUTSIDER
		)

		await this.locationFixture.addPerson({
			personId: person.id,
			organizationId: org.id,
			locationId: location.id,
			roleBase: 'guest',
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
		})

		const isHired = await this.locationFixture.isPartOfLocation({
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
			personId: person.id,
			locationId: location.id,
		})

		assert.isTrue(isHired)
	}
}
