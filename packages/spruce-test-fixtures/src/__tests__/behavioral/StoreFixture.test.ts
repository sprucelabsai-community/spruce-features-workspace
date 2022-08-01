import {
	DatabaseFixture,
	StoreLoader,
	StoreFactory,
	CursorPagerFaker,
} from '@sprucelabs/data-stores'
import AbstractSpruceTest, { assert, test } from '@sprucelabs/test'
import FixtureFactory from '../../tests/fixtures/FixtureFactory'
import StoreFixture from '../../tests/fixtures/StoreFixture'

declare module '@sprucelabs/data-stores/build/types/stores.types' {
	interface StoreMap {
		good: any
	}
}

export default class StoreFixtureTest extends AbstractSpruceTest {
	private static originalDestroy: () => Promise<void>
	private static originalAfterEach: () => Promise<void>

	protected static async beforeAll() {
		await super.beforeAll()
		this.originalDestroy = DatabaseFixture.destroy.bind(DatabaseFixture)
		this.originalAfterEach = DatabaseFixture.afterEach.bind(DatabaseFixture)
	}
	protected static async beforeEach() {
		await super.beforeEach()
		DatabaseFixture.destroy = this.originalDestroy
		DatabaseFixture.afterEach = this.originalAfterEach
	}

	@test()
	protected static async canGetFixture() {
		assert.isTruthy(this.FixtureFactory().Fixture('store'))
	}

	@test()
	protected static async canGetFunctioningStores() {
		this.setStoreDirToOneGoodStore()

		const dbFixture = this.FixtureFactory().Fixture('database')
		const db = await dbFixture.connectToDatabase()

		StoreLoader.setDatabase(db)

		const fixture = this.FixtureFactory().Fixture('store')
		const goodStore = await fixture.Store('good')
		assert.isTruthy(goodStore)
	}

	@test()
	protected static async beforeAllCallsBeforeAllOnDatabaseFixture() {
		let wasHit = false

		//@ts-ignore
		DatabaseFixture.beforeAll = () => {
			wasHit = true
		}

		await StoreFixture.beforeAll()

		assert.isTrue(wasHit)
	}

	@test()
	protected static async beforeEachCallsDestroyOnDatabaseFixture() {
		let wasHit = false

		//@ts-ignore
		DatabaseFixture.destroy = () => {
			wasHit = true
		}

		await StoreFixture.beforeEach()

		assert.isTrue(wasHit)
	}

	@test()
	protected static async afterEachCallsAfterEachOnDatabaseFixture() {
		let wasHit = false

		//@ts-ignore
		DatabaseFixture.afterEach = () => {
			wasHit = true
		}

		await StoreFixture.afterEach()

		assert.isTrue(wasHit)
	}

	@test()
	protected static async storeLoaderUsesNewInstanceOfDbEachRun() {
		const loader1 = await StoreLoader.getInstance()

		await StoreFixture.beforeEach()

		const loader2 = await StoreLoader.getInstance()

		//@ts-ignore
		assert.isNotEqual(loader1.db, loader2.db)
	}

	@test()
	protected static async storeFixtureCallsResetOnStoreFactory() {
		let wasHit = false
		//@ts-ignore
		StoreFactory.reset = () => {
			wasHit = true
		}

		await StoreFixture.beforeEach()
		assert.isTrue(wasHit)
	}

	@test()
	protected static async callsBeforeEachOnCursorFaker() {
		let wasHit = false

		//@ts-ignore
		CursorPagerFaker.beforeEach = () => {
			wasHit = true
		}

		await StoreFixture.beforeEach()
		assert.isTrue(wasHit)
	}

	@test()
	protected static async canGetStore() {
		this.setStoreDirToOneGoodStore()
		const fixture = this.FixtureFactory().Fixture('store')
		const stores = await fixture.getStoreFactory()
		const store1 = await stores.getStore('good')
		const store2 = await fixture.getStore('good')
		assert.isEqual(store1, store2)
	}

	private static setStoreDirToOneGoodStore() {
		StoreLoader.setStoreDir(
			this.resolvePath(
				__dirname,
				'..',
				'testDirsAndFiles',
				'one-good-store-skill',
				'build'
			)
		)
	}

	private static FixtureFactory() {
		return new FixtureFactory({ cwd: this.cwd })
	}
}
