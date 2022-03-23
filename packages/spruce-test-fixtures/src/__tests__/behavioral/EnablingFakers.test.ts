import { generateId } from '@sprucelabs/data-stores'
import { MercuryClient, MercuryTestClient } from '@sprucelabs/mercury-client'
import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { assert, test } from '@sprucelabs/test'
import { errorAssert } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import { DEMO_NUMBER, DEMO_NUMBER_HIRING } from '../../tests/constants'
import fake from '../../tests/decorators/fake'
import { CoreSeedTargets } from '../../tests/decorators/seed'

export default class EnablingFakersTest extends AbstractSpruceFixtureTest {
	private static client: MercuryClient
	private static fakedOwner: SpruceSchemas.Spruce.v2020_07_22.Person
	private static fakedOrganizations: SpruceSchemas.Spruce.v2020_07_22.Organization[]
	private static fakedLocations: SpruceSchemas.Spruce.v2020_07_22.Location[]

	protected static async beforeEach() {
		await super.beforeEach()
		this.client = await this.mercury.connectToApi()
		//@ts-ignore
		this.fakedOwner = undefined
	}

	@test()
	protected static throwsWhenMissingPhone() {
		//@ts-ignore
		assert.doesThrow(() => fake.login())
	}

	@test()
	protected static throwsWhenInvalidPhone() {
		//@ts-ignore
		assert.doesThrow(() => fake.login(generateId()))
	}

	@test()
	protected static async fakingLoginSetsRequireLocalListeners() {
		await this.fakeLogin(DEMO_NUMBER)
		assert.isTrue(MercuryTestClient.getShouldRequireLocalListeners())
	}

	@test()
	protected static async fakesWhoAmI() {
		const number = DEMO_NUMBER_HIRING
		const auth = await this.fakeLoginAndGetAuth(number)

		assert.doesInclude(auth.person, {
			phone: number,
		})
	}

	@test()
	protected static async setsOwnerToClass() {
		const auth = await this.fakeLoginAndGetAuth()
		assert.isEqualDeep(this.fakedOwner, auth.person)
	}

	@test()
	protected static async getPersonThrowsWithoutPersonId() {
		await this.fakeLogin()

		await assert.doesThrowAsync(() =>
			this.client.emitAndFlattenResponses('get-person::v2020_12_25', {
				target: {},
			})
		)
	}

	@test()
	protected static async fakesGetPerson() {
		await this.fakeLogin()

		const [{ person }] = await this.client.emitAndFlattenResponses(
			'get-person::v2020_12_25',
			{
				target: {
					personId: this.fakedOwner.id,
				},
			}
		)

		assert.isEqualDeep(person, this.fakedOwner)
	}

	@test()
	protected static async getPersonThrowsWithBadId() {
		await this.fakeLogin()

		const err = await assert.doesThrowAsync(() =>
			this.client.emitAndFlattenResponses('get-person::v2020_12_25', {
				target: {
					personId: generateId(),
				},
			})
		)

		errorAssert.assertError(err, 'INVALID_TARGET')
	}

	@test()
	protected static async fakingFailWithMissingParams() {
		//@ts-ignore
		const err = assert.doesThrow(() => fake())
		errorAssert.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['target', 'total'],
		})
	}

	@test()
	protected static async failsWithoutOwner() {
		await assert.doesThrowAsync(
			() => this.fakeRecords('organizations', 1),
			'faker.login'
		)
	}

	@test('can seed 1 org', 1)
	@test('can seed 2 orgs', 2)
	protected static async seedsOrg(total: number) {
		await this.fakeLoginAndRecords('organizations', total)
		assert.isLength(this.fakedOrganizations, total)
	}

	@test('can get 0th org', 0)
	@test('can get 1st org', 1)
	protected static async fakesGetOrganization(orgIdx: number) {
		await this.fakeLoginAndRecords('organizations', 2)
		const orgId = this.fakedOrganizations[orgIdx].id
		const organization = await this.emitGetOrganization(orgId)

		assert.isEqualDeep(this.fakedOrganizations[orgIdx], organization)
	}

	@test()
	protected static async gettingOrgThrowsWithBadOrgId() {
		await this.fakeLoginAndRecords('organizations', 1)
		const err = await assert.doesThrowAsync(() =>
			this.emitGetOrganization(generateId())
		)

		errorAssert.assertError(err, 'INVALID_TARGET')
	}

	@test()
	protected static async fakingOrgsMoreThanOnceStacks() {
		await this.fakeLoginAndRecords('organizations', 1)
		await this.fakeRecords('organizations', 1)
		assert.isLength(this.fakedOrganizations, 2)
	}

	@test()
	protected static async fakesListOrgsAndReturnsNewestFirst() {
		const organizations = await this.fakeLoginAndListOrgs()
		const sorted = this.sortRecords(this.fakedOrganizations)

		assert.isEqualDeep(organizations, sorted)
		assert.isEqualDeep(this.fakedOrganizations, sorted)
	}

	@test('honors limit 1', 1)
	@test('honors limit 2', 2)
	protected static async listOrgsHonorsLimit(limit: number) {
		const orgs = await this.fakeLoginAndListOrgs({
			paging: {
				pageSize: limit,
			},
		})

		assert.isLength(orgs, limit)
	}

	@test()
	protected static async canGetLatestOrgWithScope() {
		await this.fakeLoginAndRecords('organizations', 5)
		const org = await this.views.getScope().getCurrentOrganization()
		assert.isEqualDeep(org, this.fakedOrganizations[0])
	}

	@test('seeding locations seeds 1 org 1', 1)
	@test('seeding locations seeds 1 org 2', 2)
	protected static async seedingLocationSeedsOneOrg(totalLocations: number) {
		await this.fakeLoginAndRecords('locations', totalLocations)
		assert.isLength(this.fakedOrganizations, 1)
	}

	@test('seeds expected amount of locations 1', 1)
	@test('seeds expected amount of locations 2', 2)
	protected static async seedsGoodLocation(total: number) {
		await this.fakeLoginAndRecords('locations', total)
		assert.isLength(this.fakedLocations, total)
	}

	@test()
	protected static async sortsLocationsNewestFirst() {
		await this.fakeLoginAndRecords('locations', 5)
		const expected = this.sortRecords(this.fakedLocations)
		assert.isEqualDeep(this.fakedLocations, expected)
	}

	@test()
	protected static async canGetLocationFromScope() {
		await this.fakeLoginAndRecords('locations', 10)

		const location = await this.views.getScope().getCurrentLocation()
		assert.isEqualDeep(location, this.fakedLocations[0])
	}

	private static sortRecords(
		records: SpruceSchemas.Spruce.v2020_07_22.Organization[]
	) {
		return [...records].sort((a, b) => {
			return a.id > b.id ? -1 : 1
		})
	}

	private static async emitGetOrganization(orgId: string) {
		const [{ organization }] = await this.client.emitAndFlattenResponses(
			'get-organization::v2020_12_25',
			{
				target: {
					organizationId: orgId,
				},
			}
		)

		return organization
	}

	private static async fakeLoginAndRecords(
		target: CoreSeedTargets,
		count: number
	) {
		await this.fakeLogin()
		await EnablingFakersTest.fakeRecords(target, count)
	}

	private static async fakeRecords(target: CoreSeedTargets, count: number) {
		const decorator = fake(target, count)
		await decorator(this as any)
	}

	private static async fakeLoginAndListOrgs(
		payload?: SpruceSchemas.Mercury.v2020_12_25.ListOrgsEmitPayload
	) {
		await this.fakeLoginAndRecords('organizations', 5)
		const [{ organizations }] = await this.client.emitAndFlattenResponses(
			'list-organizations::v2020_12_25',
			{
				payload,
			}
		)

		return organizations
	}

	protected static async fakeLoginAndGetAuth(phone: string = DEMO_NUMBER) {
		await this.fakeLogin(phone)

		const [{ auth, type }] = await this.client.emitAndFlattenResponses(
			'whoami::v2020_12_25'
		)

		assert.isEqual(type, 'authenticated')

		return auth
	}

	private static async fakeLogin(number: string = DEMO_NUMBER) {
		const decorator = fake.login(number)
		await decorator(this as any)
	}
}
