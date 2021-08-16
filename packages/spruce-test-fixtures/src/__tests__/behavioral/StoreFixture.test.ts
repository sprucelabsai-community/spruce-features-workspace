import { DatabaseFixture, StoreLoader } from '@sprucelabs/data-stores'
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
	protected static async beforeAll() {
		await super.beforeAll()
		this.originalDestroy = DatabaseFixture.destroy.bind(DatabaseFixture)
	}
	protected static async beforeEach() {
		await super.beforeEach()
		DatabaseFixture.destroy = this.originalDestroy
	}

	@test()
	protected static async canGetFixture() {
		assert.isTruthy(this.Fixture().Fixture('store'))
	}

	@test()
	protected static async canGetFunctioningStores() {
		StoreLoader.setStoreDir(
			this.resolvePath(
				__dirname,
				'..',
				'testDirsAndFiles',
				'one-good-store-skill',
				'build'
			)
		)

		const dbFixture = this.Fixture().Fixture('database')
		const db = await dbFixture.connectToDatabase()

		StoreLoader.setDatabase(db)

		const fixture = this.Fixture().Fixture('store')
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
	protected static async storeLoaderUsesNewInstanceOfDbEachRun() {
		const loader1 = await StoreLoader.getInstance()

		await StoreFixture.beforeEach()

		const loader2 = await StoreLoader.getInstance()

		//@ts-ignore
		assert.isNotEqual(loader1.db, loader2.db)
	}

	private static Fixture() {
		return new FixtureFactory({ cwd: this.cwd })
	}
}
