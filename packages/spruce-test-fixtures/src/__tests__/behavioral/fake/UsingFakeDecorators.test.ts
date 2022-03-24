import { MercuryClient } from '@sprucelabs/mercury-client'
import { test, assert } from '@sprucelabs/test'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import fake, {
	fakeTargetToPropName,
	pluralToSingular,
} from '../../../tests/decorators/fake'
import { CoreSeedTarget } from '../../../tests/decorators/seed'

@fake.login('555-000-0001')
export default class UsingFakeDecoratorsTest extends AbstractSpruceFixtureTest {
	private static wasBeforeAllInvoked = false
	private static wasBeforeEachInvoked = false
	private static client: MercuryClient

	protected static async beforeAll(): Promise<void> {
		await super.beforeAll()
		this.wasBeforeAllInvoked = true
	}

	protected static async beforeEach(): Promise<void> {
		await super.beforeEach()
		this.wasBeforeEachInvoked = true
		this.client = await this.mercury.connectToApi()
		await this.client.emitAndFlattenResponses('whoami::v2020_12_25')
	}

	@test()
	protected static async skillCallsHooks() {
		assert.isTrue(this.wasBeforeAllInvoked)
		assert.isTrue(this.wasBeforeEachInvoked)
	}

	@test()
	protected static async canSeedOrganization() {
		const org = await this.organizations.seedDemoOrganization({
			name: 'Test org',
		})

		assert.isEqual(org.name, 'Test org')
	}

	@test('can seed location to org 1', 0)
	@test('can seed location to org 2', 1)
	@fake('organizations', 2)
	protected static async seedingLocationSeedsToExpectedOrg(orgIdx: number) {
		const id = this.fakedOrganizations[orgIdx].id
		const location = await this.locations.seedDemoLocation({
			name: 'Test location',
			organizationId: id,
		})

		assert.isEqual(id, location.organizationId)
	}

	@test('list locations by org 1', 0)
	@test('list locations by org 0', 1)
	@fake('organizations', 1)
	@fake('locations', 2)
	@fake('organizations', 1)
	@fake('locations', 2)
	protected static async canSeedAndListLocations(orgIdx: number) {
		const id = this.fakedOrganizations[orgIdx].id
		const [{ locations }] = await this.client.emitAndFlattenResponses(
			'list-locations::v2020_12_25',
			{
				target: {
					organizationId: id,
				},
			}
		)

		const expected = this.fakedLocations.filter((l) => l.organizationId === id)
		assert.isEqualDeep(locations, expected)
	}

	@test('can seed teammates', 'teammates')
	@test('can seed managers', 'managers')
	@test('can seed guests', 'guests')
	@test('can seed groupManagers', 'groupManagers')
	@fake('locations', 1)
	@fake('teammates', 3)
	@fake('managers', 3)
	@fake('guests', 3)
	@fake('groupManagers', 3)
	protected static async canSeedTeammates(target: CoreSeedTarget) {
		let total = 3

		const { people, fakedRecords } = await this.assertFakedPeople(target, total)

		assert.doesNotInclude(people, this.fakedOwner)
		assert.isEqualDeep(people, fakedRecords)
	}

	@test()
	@fake('locations', 1)
	@fake('owners', 3)
	protected static async canSeedOwners() {
		await this.assertFakedPeople('owners', 4)
	}

	@test()
	@fake('locations', 1)
	protected static async whoAmIReturnsExpectedPerson() {
		const phone = '555-111-1111'
		const { person, client } = await this.people.loginAsDemoPerson(phone)
		assert.isEqual(person.phone, phone)
		const [{ auth }] = await client.emitAndFlattenResponses(
			'whoami::v2020_12_25'
		)

		assert.isEqualDeep(auth.person, person)
	}

	@test()
	protected static async canSkillBeAnonLogin() {
		const client = await this.mercury.connectToApi({
			shouldReUseClient: false,
		})
		const [{ type }] = await client.emitAndFlattenResponses(
			'whoami::v2020_12_25'
		)
		assert.isEqualDeep(type, 'anonymous')
	}

	@test()
	@fake('locations', 1)
	@fake('teammates', 4)
	protected static async canListTeammatesByLocation() {
		const [{ people }] = await this.client.emitAndFlattenResponses(
			'list-people::v2020_12_25',
			{
				target: {
					organizationId: this.fakedLocations[0].organizationId,
					locationId: this.fakedLocations[0].id,
				},
			}
		)

		assert.isLength(people, 5)
	}

	private static async assertFakedPeople(target: string, total: number) {
		//@ts-ignore
		const fakedRecords = this[`${fakeTargetToPropName(target)}`] as any[]

		assert.isLength(fakedRecords, total)

		const people = await this.people.listPeople({
			locationId: this.fakedLocations[0].id,
			roleBases: [pluralToSingular(target)],
			organizationId: this.fakedLocations[0].organizationId,
		})

		assert.isLength(people, total)

		assert.isTruthy(fakedRecords[0].firstName)
		assert.isNotEqual(fakedRecords[0].casualName, 'friend')

		return { people, fakedRecords }
	}
}
