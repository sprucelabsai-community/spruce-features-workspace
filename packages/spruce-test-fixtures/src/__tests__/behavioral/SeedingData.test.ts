import { MercuryClient } from '@sprucelabs/mercury-client'
import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { formatPhoneNumber } from '@sprucelabs/schema'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { assert, test } from '@sprucelabs/test-utils'
import { errorAssert } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import {
	DEMO_NUMBER_SEED_FIXTURE,
	DEMO_NUMBER_SEED_FIXTURE_STARTING_PHONE,
	DEMO_NUMBER_SEED_FIXTURE_STARTING_PHONE_ALT,
} from '../../tests/constants'
import fake from '../../tests/decorators/fake'
import SeedFixture, {
	SeedLocationOptions,
} from '../../tests/fixtures/SeedFixture'

const sorter = (a: any, b: any) => (a.id > b.id ? 1 : -1)

@fake.login(DEMO_NUMBER_SEED_FIXTURE)
export default class SeedingDataTest extends AbstractSpruceFixtureTest {
	private static fixture: SeedFixture
	private static client: MercuryClient

	protected static async beforeEach() {
		await super.beforeEach()

		this.client = fake.getClient()
		this.fixture = this.Fixture('seed')

		await this.fixture.resetAccount(DEMO_NUMBER_SEED_FIXTURE)
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
		const { locations } = await this.fixture.seedAccount({
			totalLocations: 5,
		})

		assert.isLength(locations, 5)
	}

	@test()
	protected static async seedingOrgsCreatesOrganization() {
		const { locations } = await this.fixture.seedAccount({
			totalLocations: 3,
		})
		assert.isLength(locations, 3)

		await this.assertOnlyOneOrgExists()
	}

	@test()
	protected static async canPassOrgToLocationSeeder() {
		const org = await this.organizations.seedDemoOrganization()
		await this.fixture.seedAccount({
			totalLocations: 3,
			organizationId: org.id,
		})

		await this.assertOnlyOneOrgExists()
	}

	@test()
	protected static async throwsWhenSeedingWithoutCount() {
		//@ts-ignore
		const err = await assert.doesThrowAsync(() => this.fixture.seedAccount({}))
		errorAssert.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['totalLocations'],
		})
	}

	@test()
	protected static async actuallyCreatesLocations() {
		const { organization, locations } = await this.seedLocations()

		const results = await this.client.emit('list-locations::v2020_12_25', {
			target: {
				organizationId: organization.id,
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

	@test('missing starting phone with totalGuests', { totalGuests: 10 })
	@test('missing starting phone with totalTeammates', { totalTeammates: 10 })
	protected static async needsStartingPhoneWhenSeedingPeople(options: any) {
		const err = await assert.doesThrowAsync(() =>
			this.seedLocations({
				...options,
			})
		)

		errorAssert.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['startingPhone'],
		})
	}

	@test('can seed 3 guests', { totalGuests: 3 }, 3, 'guest')
	@test('can seed 5 guests', { totalGuests: 5 }, 5, 'guest')
	@test('can seed 2 teammates', { totalTeammates: 2 }, 2, 'teammate')
	@test('can seed 3 managers', { totalManagers: 3 }, 3, 'manager')
	@test('can seed 3 groupManager', { totalGroupManagers: 3 }, 3, 'groupManager')
	@test('can seed 1 owners', { totalOwners: 1 }, 1, 'owner')
	protected static async returnsSeededGuests(
		options: any,
		expectedCount: number,
		base: string
	) {
		const { locations, ...rest } = await this.seedLocations({
			totalLocations: 1,
			startingPhone: DEMO_NUMBER_SEED_FIXTURE_STARTING_PHONE,
			...options,
		})

		const withoutOwner = await this.listPeople(locations[0], base)
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const withoutOwnerCleaned = withoutOwner.map(({ roleIds, ...rest }) => rest)

		//@ts-ignore
		const people = rest[base + 's'] ?? []

		people.sort(sorter)
		withoutOwnerCleaned.sort(sorter)

		assert.isLength(withoutOwner, expectedCount)
		assert.isEqualDeep(people, withoutOwnerCleaned)
	}

	@test('seeds with starting phone 1', DEMO_NUMBER_SEED_FIXTURE_STARTING_PHONE)
	@test(
		'seeds with starting phone 2',
		DEMO_NUMBER_SEED_FIXTURE_STARTING_PHONE_ALT
	)
	protected static async setsFirstPersonsNumberToTheStartingPhone(
		phone: string
	) {
		const { guests } = await this.seedLocations({
			totalLocations: 1,
			totalGuests: 1,
			startingPhone: phone,
		})
		assert.isEqual(guests[0].phone, formatPhoneNumber(phone))
	}

	@test()
	protected static async canSeedMultipleRolesAtOnce() {
		const { locations } = await this.seedLocations({
			startingPhone: DEMO_NUMBER_SEED_FIXTURE_STARTING_PHONE,
			totalLocations: 1,
			totalGuests: 3,
			totalManagers: 2,
		})

		const people = await this.listPeople(locations[0], ['guest', 'manager'])
		assert.isLength(people, 5)
	}

	@test()
	protected static async seededPeopleHaveNames() {
		const { teammates } = await this.seedLocations({
			startingPhone: DEMO_NUMBER_SEED_FIXTURE_STARTING_PHONE,
			totalLocations: 1,
			totalTeammates: 2,
		})

		assert.isTruthy(teammates[0].firstName)
	}

	@test()
	protected static async peopleAllHaveUniqueNames() {
		const { teammates } = await this.seedLocations({
			startingPhone: DEMO_NUMBER_SEED_FIXTURE_STARTING_PHONE,
			totalLocations: 1,
			totalTeammates: 2,
		})

		const names = teammates.map((t) => t.casualName)
		const unique = [...new Set(names)]

		assert.isLength(unique, names.length)
	}

	@test()
	protected static async namesAreOnlyAssignedIfNotYetAssigned() {
		const { client } = await this.people.loginAsDemoPerson(
			DEMO_NUMBER_SEED_FIXTURE_STARTING_PHONE
		)

		const firstName = `Test person:: ${Math.random()}`
		const lastName = `${Math.random()}`

		await client.emitAndFlattenResponses('update-person::v2020_12_25', {
			payload: {
				firstName,
				lastName,
			},
		})

		const { teammates } = await this.seedLocations({
			startingPhone: DEMO_NUMBER_SEED_FIXTURE_STARTING_PHONE,
			totalLocations: 1,
			totalTeammates: 1,
		})

		const [tm1] = teammates

		assert.isEqual(tm1.casualName, firstName + ' ' + lastName[0] + '.')
	}

	private static async listPeople(
		location: SpruceSchemas.Spruce.v2020_07_22.Location,
		base: string | string[]
	) {
		const people = await this.people.listPeople({
			locationId: location.id,
			organizationId: location.organizationId,
			roleBases: Array.isArray(base) ? base : [base],
			shouldIncludePrivateFields: true,
		})

		const withoutOwner = people.filter((p) => p.id !== fake.getPerson().id)
		return withoutOwner
	}

	private static async seedLocations(options?: Partial<SeedLocationOptions>) {
		const org = await this.organizations.seedDemoOrganization()

		const results = await this.fixture.seedAccount({
			totalLocations: 3,
			organizationId: org.id,
			...options,
		})

		return { organization: org, ...results }
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
