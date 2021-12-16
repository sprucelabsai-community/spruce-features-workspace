import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { test, assert } from '@sprucelabs/test'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import {
	DEMO_NUMBER_LOCATION_FIXTURE,
	DEMO_NUMBER_LOCATION_FIXTURE_OUTSIDER,
} from '../../tests/constants'
import LocationFixture from '../../tests/fixtures/LocationFixture'
import OrganizationFixture from '../../tests/fixtures/OrganizationFixture'
import PersonFixture from '../../tests/fixtures/PersonFixture'
import RoleFixture from '../../tests/fixtures/RoleFixture'

export default class LocationFixtureTest extends AbstractSpruceFixtureTest {
	private static orgFixture: OrganizationFixture
	private static locationFixture: LocationFixture
	private static personFixture: PersonFixture
	private static roleFixture: RoleFixture

	protected static async beforeEach() {
		await super.beforeEach()
		this.orgFixture = this.Fixture('organization')
		this.locationFixture = this.Fixture('location')
		this.personFixture = this.Fixture('person')
		this.roleFixture = this.Fixture('role')

		const seedFixture = this.Fixture('seed')
		await seedFixture.resetAccount(DEMO_NUMBER_LOCATION_FIXTURE_OUTSIDER)
		await seedFixture.resetAccount(DEMO_NUMBER_LOCATION_FIXTURE)
	}

	@test()
	protected static async canCreateWithSpecificOrg() {
		const org = await this.orgFixture.seedDemoOrganization({
			name: 'Location fixture org',
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
		})

		const location = await this.locationFixture.seedDemoLocation({
			name: 'Location fixture location',
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
			organizationId: org.id,
		})

		assert.isEqual(org.id, location.organizationId)
	}

	@test()
	protected static async canCreatLocationWithNoParams() {
		const location = await this.locationFixture.seedDemoLocation()
		assert.isTruthy(location)
	}

	@test()
	protected static async knowsIfSomeoneIsNotPartOfLocation() {
		const { person, location } = await this.seedLocationAndOutsider()

		const isPartOf = await this.locationFixture.isPartOfLocation(
			person.id,
			location.id
		)

		assert.isFalse(isPartOf)
	}

	@test()
	protected static async addingSomeoneToLocationsShowsThemAsAdded() {
		const { person, location } = await this.seedLocationAndOutsider()

		await this.locationFixture.addToLocation(person.id, location.id)

		const personId = person.id
		const locationId = location.id
		await this.assertIsPartOfLocation(personId, locationId)
	}

	@test.only()
	protected static async canTellIfSomeoneWasAddedOutsideTheFixture() {
		const { person, location, ownerClient } =
			await this.seedLocationAndOutsider()

		const guestRole = await this.roleFixture.fetchFirstRoleWithBase({
			organizationId: location.organizationId,
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
			base: 'guest',
		})

		const locations = await this.locationFixture.listLocations({
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
			organizationId: location.organizationId,
		})

		debugger

		const results = await ownerClient.emit('set-role::v2020_12_25', {
			target: {
				locationId: location.id,
			},
			payload: {
				personId: person.id,
				roleId: guestRole.id,
			},
		})

		eventResponseUtil.getFirstResponseOrThrow(results)

		await this.assertIsPartOfLocation(person.id, location.id)
	}

	private static async assertIsPartOfLocation(
		personId: string,
		locationId: string
	) {
		const isPartOf = await this.locationFixture.isPartOfLocation(
			personId,
			locationId,
			DEMO_NUMBER_LOCATION_FIXTURE
		)

		assert.isTrue(isPartOf)
	}

	private static async seedLocationAndOutsider() {
		const location = await this.locationFixture.seedDemoLocation({
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
		})
		const { client: ownerClient } = await this.personFixture.loginAsDemoPerson(
			DEMO_NUMBER_LOCATION_FIXTURE
		)
		const { person } = await this.personFixture.loginAsDemoPerson(
			DEMO_NUMBER_LOCATION_FIXTURE_OUTSIDER
		)

		return { location, person, ownerClient }
	}
}
