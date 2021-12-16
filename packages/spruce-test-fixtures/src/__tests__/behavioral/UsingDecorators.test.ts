import { AbstractStore } from '@sprucelabs/data-stores'
import { AuthenticatorImpl } from '@sprucelabs/heartwood-view-controllers'
import { MercuryClient, MercuryClientFactory } from '@sprucelabs/mercury-client'
import { buildSchema } from '@sprucelabs/schema'
import { test, assert } from '@sprucelabs/test'
import { MercuryFixture, StoreFixture } from '../..'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import { DEMO_NUMBER_DECORATORS } from '../../tests/constants'
import login from '../../tests/decorators/login'
import seed from '../../tests/decorators/seed'
import { StoreSeedOptions } from '../../types/store.types'
// eslint-disable-next-line spruce/prohibit-import-from-build-folder
import GoodStore from '../testDirsAndFiles/one-good-store-skill/build/stores/Good.store'

@login(DEMO_NUMBER_DECORATORS)
export default class UsingDecoratorsTest extends AbstractSpruceFixtureTest {
	private static lastClient: MercuryClient
	private static goodStore: GoodStore

	@seed('good', 5)
	@seed('dummies', 10)
	protected static async beforeEach() {
		assert.isTrue(MercuryClientFactory.isInTestMode())
		this.goodStore = await this.Fixture('store').Store('good')

		await this.assertCountGoods(5)
		await super.beforeEach()

		const auth = AuthenticatorImpl.getInstance()
		assert.isTruthy(auth.getSessionToken())

		const client = login.getClient()

		assert.isTruthy(client)
		assert.isTrue(client.isConnected())
		assert.isTrue(client.getIsTestClient())

		this.lastClient = client

		//@ts-ignore
		assert.isEqualDeep(auth.getPerson(), client.auth.person)
		//@ts-ignore
		assert.isEqualDeep(auth.getSessionToken(), client.auth.token)

		this.goodStore = await this.Fixture('store').Store('good')

		await this.assertCountGoods(5)
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

	@test()
	protected static logsInViewAuthenticator() {
		assert.isTruthy(AuthenticatorImpl.getInstance().getSessionToken())
	}

	@test('passes through args 1', 1, 1, 1)
	@seed('dummies', 3)
	protected static passesThroughArgs(one: number, two: number, three: number) {
		assert.isEqual(one, 1)
		assert.isEqual(two, 1)
		assert.isEqual(three, 1)
	}

	@test('passes through args 2', { hello: 'world' })
	@seed('dummies', 3)
	protected static passesThroughArgs2(one: any) {
		assert.isEqualDeep(one, { hello: 'world' })
	}

	@test()
	@seed('good', 5)
	protected static async seedsAddToBeforeEach() {
		await this.assertCountGoods(10)
	}

	@test()
	@seed('good', 1)
	protected static async seedsAddToBeforeEachButNotLastRun() {
		await this.assertCountGoods(6)
	}

	@test()
	protected static async canGetClientOffLogin() {
		assert.isFunction(login.getClient)
		assert.isEqual(login.getClient(), MercuryFixture.getDefaultClient())
	}

	private static async assertCountOrgs(expected: number) {
		const organizations = await this.Fixture('organization').listOrganizations()
		assert.isLength(organizations, expected)
	}

	private static async assertCountLocations(expected: number) {
		const org = await this.Fixture('view').getScope().getCurrentOrganization()

		assert.isTruthy(org)

		const organizationId = org.id
		const locations = await this.Fixture('location').listLocations({
			organizationId,
		})

		assert.isLength(locations, expected)
	}

	private static async assertCountGoods(expected: number) {
		const goodStore = await this.Fixture('store').Store('good')
		const count = await goodStore.count({})
		assert.isEqual(count, expected)
		const localCount = await this.goodStore.count({})
		assert.isEqual(
			localCount,
			expected,
			'The store built in beforeEach is pointing at stale database.'
		)
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

StoreFixture.setStore('dummies', DummyStore)
StoreFixture.setStore('good', GoodStore)
