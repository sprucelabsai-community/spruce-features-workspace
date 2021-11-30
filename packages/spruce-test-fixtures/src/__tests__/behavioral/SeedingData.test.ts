import { MercuryClient } from '@sprucelabs/mercury-client'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { assert, test } from '@sprucelabs/test'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import { DEMO_NUMBER_SEED_FIXTURE } from '../../tests/constants'
import MercuryFixture from '../../tests/fixtures/MercuryFixture'
import SeedFixture from '../../tests/fixtures/SeedFixture'

export default class SeedingDataTest extends AbstractSpruceFixtureTest {
	private static fixture: SeedFixture
	private static client: MercuryClient

	protected static async beforeEach() {
		await super.beforeEach()

		const { client } = await this.Fixture('person').loginAsDemoPerson(
			DEMO_NUMBER_SEED_FIXTURE
		)

		this.client = client

		MercuryFixture.setDefaultClient(client)

		this.fixture = this.Fixture('seed')
		await this.fixture.resetAccount()
	}

	@test()
	protected static hasSeedFixture() {
		assert.isTruthy(this.fixture)
	}

	@test()
	protected static async canSeedManyOrgs() {
		const organizations = await this.fixture.seedOrganizations({
			totalOrganizations: 5,
		})
		assert.isLength(organizations, 5)
	}

	@test()
	protected static async actuallyCreatesOrgs() {
		const organizations = await this.fixture.seedOrganizations({
			totalOrganizations: 3,
		})
		const results = await this.client.emit('list-organizations::v2020_12_25', {
			payload: {
				shouldOnlyShowMine: true,
			},
		})

		const { organizations: matched } =
			eventResponseUtil.getFirstResponseOrThrow(results)

		assert.isLength(matched, 3)
		assert.isLength(organizations, 3)

		for (const org of organizations) {
			const results = await this.client.emit('get-organization::v2020_12_25', {
				target: {
					organizationId: org.id,
				},
			})

			eventResponseUtil.getFirstResponseOrThrow(results)
		}
	}

	@test()
	protected static async canSeedLocations() {
		const locations = await this.fixture.seedLocations({
			totalLocations: 5,
		})

		assert.isLength(locations, 5)
	}

	@test()
	protected static async seedingOrgsCreatesOrganization() {
		const locations = await this.fixture.seedLocations({ totalLocations: 3 })
		assert.isLength(locations, 3)

		await this.assertOnlyOneOrgExists()
	}

	@test()
	protected static async canPassOrgToLocationSeeder() {
		const org = await this.Fixture('organization').seedDemoOrganization()
		await this.fixture.seedLocations({
			totalLocations: 3,
			organizationId: org.id,
		})

		await this.assertOnlyOneOrgExists()
	}

	@test()
	protected static async actuallyCreatesLocations() {
		const { organization, locations } = await this.seedLocations()

		const results = await this.client.emit('list-locations::v2020_12_25', {
			target: {
				organizationId: organization.id,
			},
			payload: {
				includePrivateLocations: true,
			},
		})

		const { locations: matches } =
			eventResponseUtil.getFirstResponseOrThrow(results)

		assert.isLength(matches, 3)

		for (const location of locations) {
			const results = await this.client.emit('get-location::v2020_12_25', {
				target: {
					locationId: location.id,
				},
			})

			eventResponseUtil.getFirstResponseOrThrow(results)
		}
	}

	private static async seedLocations() {
		const org = await this.Fixture('organization').seedDemoOrganization()

		const locations = await this.fixture.seedLocations({
			totalLocations: 3,
			organizationId: org.id,
		})

		return { organization: org, locations }
	}

	private static async assertOnlyOneOrgExists() {
		const results = await this.client.emit('list-organizations::v2020_12_25', {
			payload: {
				shouldOnlyShowMine: true,
			},
		})

		const { organizations } = eventResponseUtil.getFirstResponseOrThrow(results)
		assert.isLength(organizations, 1)

		assert.isObject(organizations[0].address)
	}
}
