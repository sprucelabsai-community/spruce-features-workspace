import { AbstractStore } from '@sprucelabs/data-stores'
import { MercuryClient } from '@sprucelabs/mercury-client'
import { buildSchema } from '@sprucelabs/schema'
import { test, assert } from '@sprucelabs/test'
import { MercuryFixture, StoreFixture } from '../..'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import { DEMO_NUMBER_DECORATORS } from '../../tests/constants'
import login from '../../tests/decorators/login'
import seed from '../../tests/decorators/seed'
import { StoreSeedOptions } from '../../types/store.types'

@login(DEMO_NUMBER_DECORATORS)
export default class UsingDecoratorsTest extends AbstractSpruceFixtureTest {
	private static lastClient: MercuryClient

	protected static async beforeAll() {
		await super.beforeAll()
	}

	protected static async beforeEach() {
		await super.beforeEach()

		const client = MercuryFixture.getDefaultClient()

		assert.isTruthy(client)
		assert.isTrue(client.isConnected())

		this.lastClient = client

		StoreFixture.setStore('dummies', DummyStore)
	}

	protected static async afterAll() {
		await super.afterAll()

		const client = MercuryFixture.getDefaultClient()

		assert.isFalsy(client)
		assert.isFalse(this.lastClient.isConnected())
	}

	@test()
	protected static async loginSetsDefaultClient() {
		const client = MercuryFixture.getDefaultClient()
		assert.isTruthy(client)

		assert.isTrue(client.isConnected())
	}

	@test()
	protected static async retainsClientBetweenTests() {
		const client = MercuryFixture.getDefaultClient()

		assert.isTruthy(client)
		assert.isEqual(this.lastClient, client)
		assert.isTrue(client.isConnected())
	}

	@test()
	@seed('organizations', 3)
	protected static async canSeedThreeOrgs() {
		await this.assertCountOrgs(3)
	}

	@test()
	@seed('organizations', 5)
	protected static async canSeedFiveOrgs() {
		await this.assertCountOrgs(5)
	}

	@test()
	@seed('locations', 3)
	protected static async canSeedTwoLocations() {
		await this.assertCountLocations(3)
	}

	@test()
	@seed('locations', 10)
	protected static async canSeedTenLocations() {
		await this.assertCountLocations(10)
	}

	@test()
	@seed('organizations', 10)
	@seed('locations', 10)
	protected static async locationUsesLatestOrg() {
		await this.assertCountLocations(10)
		await this.assertCountOrgs(10)
	}

	@test()
	@seed('dummies', 10)
	protected static async canSeedStores() {
		assert.isTrue(DummyStore.wasSeedInvoked)
		assert.isEqualDeep(DummyStore.seedOptions, {
			totalToSeed: 10,
			TestClass: this,
		})
	}

	private static async assertCountOrgs(expected: number) {
		const organizations = await this.Fixture('organization').listOrganizations()
		assert.isLength(organizations, expected)
	}

	private static async assertCountLocations(expected: number) {
		const org = await this.Fixture('view').getScope().getCurrentOrganization()

		assert.isTruthy(org)

		const organizationId = org.id
		const locations = await this.Fixture('location').listLocations(
			organizationId
		)

		assert.isLength(locations, expected)
	}
}

declare module '@sprucelabs/data-stores/build/types/stores.types' {
	interface StoreMap {
		dummies: DummyStore
	}
}

const dummySchema = buildSchema({
	id: 'dummy',
	fields: {
		id: {
			type: 'id',
		},
	},
})

type DummySchema = typeof dummySchema

class DummyStore extends AbstractStore<DummySchema> {
	public name = 'Dummy!'

	protected collectionName = 'dummies'
	protected createSchema = dummySchema
	protected updateSchema = dummySchema
	protected fullSchema = dummySchema
	protected databaseSchema = dummySchema

	public static wasSeedInvoked = false
	public static seedOptions = {}
	public static Store(options: any) {
		return new this(options)
	}

	public seed(options: StoreSeedOptions) {
		DummyStore.wasSeedInvoked = true
		DummyStore.seedOptions = options
	}
}
