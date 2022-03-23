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
			parameters: ['name', 'total'],
		})
	}

	@test()
	protected static async failsWithoutOwner() {
		await assert.doesThrowAsync(
			() => fake('organizations', 1)(this),
			'faker.login'
		)
	}

	@test()
	protected static async seedsOrg() {
		await this.fakeLoginAndRecords('organizations', 1)
		assert.isLength(this.fakedOrganizations, 1)
	}

	@test()
	protected static async fakesGetOrganization() {
		await this.fakeLoginAndRecords('organizations', 1)
		const [{ organization }] = await this.client.emitAndFlattenResponses(
			'get-organization::v2020_12_25',
			{
				target: {
					organizationId: this.fakedOrganizations[0].id,
				},
			}
		)
	}

	private static async fakeLoginAndRecords(
		target: CoreSeedTargets,
		count: number
	) {
		await this.fakeLogin()
		const decorator = fake(target, count)
		await decorator(this)
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
		await decorator(this)
	}
}
