import { generateId } from '@sprucelabs/data-stores'
import { MercuryClient, MercuryTestClient } from '@sprucelabs/mercury-client'
import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { formatPhoneNumber } from '@sprucelabs/schema'
import { BASE_ROLES_WITH_META } from '@sprucelabs/spruce-core-schemas'
import { assert, test } from '@sprucelabs/test'
import { errorAssert } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import {
	DEMO_NUMBER,
	DEMO_NUMBER_ACCOUNT_AFTER_ALL_RESET,
	DEMO_NUMBER_DECORATORS,
	DEMO_NUMBER_HIRING,
} from '../../../tests/constants'
import fake, {
	fakeTargetToPropName,
	pluralToSingular,
} from '../../../tests/decorators/fake'
import { CoreSeedTarget } from '../../../tests/decorators/seed'

export default class FakeDecoratorTest extends AbstractSpruceFixtureTest {
	private static client: MercuryClient

	protected static async beforeEach() {
		await super.beforeEach()
		this.client = await this.mercury.connectToApi()
	}

	@test()
	protected static doesNotThrowWhenMissingPhone() {
		fake.login()
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
	protected static async registersProxyTokenBeforeEach() {
		assert.isTruthy(fake.getClient().getProxyToken())
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
		this.fakedOwner = null as any
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

	@test()
	protected static async fakingLoginsFakesRoles() {
		await this.fakeLogin()
		assert.isLength(this.fakedRoles, 0)
	}

	@test()
	protected static async fakingOrgFakesRoles() {
		await this.fakeLoginAndRecords('organizations', 2)

		const expected = BASE_ROLES_WITH_META

		for (const { slug, name } of expected) {
			assert.doesInclude(this.fakedRoles, {
				base: slug,
				name: `Faked ${name}`,
				organizationId: this.fakedOrganizations[0].id,
			})
		}
	}

	@test()
	protected static async listRolesReturnsFakedRoles() {
		const roles = await this.fakeLoginAndListRoles(0)

		assert.isEqualDeep(
			roles,
			this.fakedRoles.filter(
				(r) => r.organizationId === this.fakedOrganizations[0].id
			)
		)
	}

	@test()
	protected static async listRolesHonorsOrgId() {
		const roles = await this.fakeLoginAndListRoles(1)
		assert.isEqualDeep(
			roles,
			this.fakedRoles.filter(
				(r) => r.organizationId === this.fakedOrganizations[1].id
			)
		)
	}

	@test('can fake 1 teammate', 'teammates', 1)
	@test('can fake 2 teammate', 'teammates', 2)
	protected static async canSyncTeammates(
		target: CoreSeedTarget,
		total: number
	) {
		await this.fakeLoginAndRecords('locations', 1)
		await this.fakeRecords(target, total)

		const fakedProp =
			//@ts-ignore
			this[fakeTargetToPropName(target)]

		assert.isLength(fakedProp, total)

		const people = await this.people.listPeople({
			locationId: this.fakedLocations[0]?.id,
			roleBases: [pluralToSingular(target)],
			organizationId: this.fakedOrganizations[0]?.id,
		})

		assert.isEqualDeep(fakedProp, people)
	}

	@test('login with number 1', DEMO_NUMBER_DECORATORS)
	@test('login with number 2', DEMO_NUMBER_ACCOUNT_AFTER_ALL_RESET)
	protected static async canLoginAsPersonAndGetThemBack(phone: string) {
		await this.fakeLogin()

		const [{ challenge }] = await this.client.emitAndFlattenResponses(
			'request-pin::v2020_12_25',
			{
				payload: {
					phone,
				},
			}
		)

		const [{ person }] = await this.client.emitAndFlattenResponses(
			'confirm-pin::v2020_12_25',
			{
				payload: {
					challenge,
					pin: '234',
				},
			}
		)

		assert.isEqual(person.phone, formatPhoneNumber(phone))
		assert.isEqualDeep(this.fakedPeople, [this.fakedOwner, person])
	}

	@test()
	protected static async sendingBadChallengeThrows() {
		await this.fakeLogin()

		const err = await assert.doesThrowAsync(() =>
			this.client.emitAndFlattenResponses('confirm-pin::v2020_12_25', {
				payload: {
					challenge: '1234',
					pin: '234',
				},
			})
		)

		errorAssert.assertError(err, 'INVALID_PIN')
	}

	@test()
	protected static async fakesSkillLifecycleEvents() {
		await this.client.emitAndFlattenResponses(
			'unregister-listeners::v2020_12_25'
		)
		await this.client.emitAndFlattenResponses(
			'sync-event-contracts::v2020_12_25',
			{
				payload: {
					contract: {
						eventSignatures: {
							['did-sync']: {},
						},
					},
				},
			}
		)
	}

	private static async fakeLoginAndListRoles(orgIdx: number) {
		await this.fakeLoginAndRecords('organizations', 2)
		const [{ roles }] = await this.client.emitAndFlattenResponses(
			'list-roles::v2020_12_25',
			{
				target: {
					organizationId: this.fakedOrganizations[orgIdx].id,
				},
				payload: {
					shouldIncludeMetaRoles: true,
				},
			}
		)

		return roles
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
		target: CoreSeedTarget,
		count: number
	) {
		await this.fakeLogin()
		await this.fakeRecords(target, count)
	}

	private static async fakeRecords(target: CoreSeedTarget, count: number) {
		const decorator = fake(target, count)
		const descriptor = {
			async value() {},
		}
		decorator(this as any, 'testName', descriptor)

		await descriptor.value()

		return decorator
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

		const { client, person } = await this.people.loginAsDemoPerson()

		const [{ auth, type }] = await client.emitAndFlattenResponses(
			'whoami::v2020_12_25'
		)

		assert.isEqual(type, 'authenticated')
		assert.isEqualDeep(auth.person, this.fakedOwner)
		assert.isEqualDeep(person, this.fakedOwner)

		return auth
	}

	private static async fakeLogin(number: string = DEMO_NUMBER) {
		const decorator = fake.login(number)
		decorator(this as any, false)
		await this.beforeAll()
		await this.beforeEach()
	}
}
