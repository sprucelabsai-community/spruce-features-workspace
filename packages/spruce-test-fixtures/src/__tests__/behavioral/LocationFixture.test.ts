import { test, assert } from '@sprucelabs/test'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import {
	DEMO_NUMBER_LOCATION_FIXTURE,
	DEMO_NUMBER_LOCATION_FIXTURE_OUTSIDER,
} from '../../tests/constants'

export default class LocationFixtureTest extends AbstractSpruceFixtureTest {
	protected static async beforeEach() {
		await super.beforeEach()
		const seedFixture = this.Fixture('seed')
		await seedFixture.resetAccount(DEMO_NUMBER_LOCATION_FIXTURE)
		await seedFixture.resetAccount(DEMO_NUMBER_LOCATION_FIXTURE_OUTSIDER)
	}

	@test()
	protected static async canCreateWithSpecificOrg() {
		const org = await this.organizations.seedDemoOrganization({
			name: 'Location fixture org',
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
		})

		const location = await this.locations.seedDemoLocation({
			name: 'Location fixture location',
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
			organizationId: org.id,
		})

		assert.isEqual(org.id, location.organizationId)
	}

	@test()
	protected static async canCreatLocationWithNoParams() {
		const location = await this.locations.seedDemoLocation({
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
		})
		assert.isTruthy(location)
	}

	@test()
	protected static async isNotPartOfLocationtoStart() {
		const location = await this.locations.seedDemoLocation({
			name: 'Location fixture location',
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
		})

		const { person } = await this.people.loginAsDemoPerson(
			DEMO_NUMBER_LOCATION_FIXTURE_OUTSIDER
		)

		const isHired = await this.locations.isPartOfLocation({
			personId: person.id,
			locationId: location.id,
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
		})

		assert.isFalse(isHired)
	}

	@test()
	protected static async canAttachPersonToLocation() {
		const { person, location } = await this.seedLocationAndAddPerson()

		const isHired = await LocationFixtureTest.isPersonPartOfLocation(
			person.id,
			location.id
		)

		assert.isTrue(isHired)
	}

	@test()
	protected static async throwsWhenTryingToRemovePersonWithBadIds() {
		await assert.doesThrowAsync(() =>
			this.locations.removePerson({
				phone: DEMO_NUMBER_LOCATION_FIXTURE,
				personId: 'aoeu',
				locationId: 'aoeu',
				roleBase: 'test',
				organizationId: '234',
			})
		)
	}

	@test()
	protected static async canRemoveRole() {
		const { person, location } = await this.seedLocationAndAddPerson()

		await this.locations.removePerson({
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
			personId: person.id,
			locationId: location.id,
			organizationId: location.organizationId,
			roleBase: 'guest',
		})

		const isHired = await this.isPersonPartOfLocation(person.id, location.id)

		assert.isFalse(isHired)
	}

	private static async isPersonPartOfLocation(
		personId: string,
		locationId: string
	) {
		return await this.locations.isPartOfLocation({
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
			personId,
			locationId,
		})
	}

	protected static async seedLocationAndAddPerson() {
		const org = await this.organizations.seedDemoOrganization({
			name: 'Location fixture org',
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
		})

		await this.organizations.seedDemoOrganization({
			name: 'Outside org',
			phone: DEMO_NUMBER_LOCATION_FIXTURE_OUTSIDER,
		})

		const location = await this.locations.seedDemoLocation({
			name: 'Location fixture location',
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
			organizationId: org.id,
		})

		const { person } = await this.people.loginAsDemoPerson(
			DEMO_NUMBER_LOCATION_FIXTURE_OUTSIDER
		)

		await this.locations.addPerson({
			personId: person.id,
			organizationId: org.id,
			locationId: location.id,
			roleBase: 'guest',
			phone: DEMO_NUMBER_LOCATION_FIXTURE,
		})

		return { location, person }
	}
}
