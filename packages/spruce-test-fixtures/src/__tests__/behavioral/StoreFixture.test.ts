import { StoreLoader } from '@sprucelabs/data-stores'
import AbstractSpruceTest, { assert, test } from '@sprucelabs/test'
import FixtureFactory from '../../tests/fixtures/FixtureFactory'

declare module '@sprucelabs/data-stores/build/types/stores.types' {
	interface StoreMap {
		good: any
	}
}

export default class StoreFixtureTest extends AbstractSpruceTest {
	protected static async beforeEach() {
		await super.beforeEach()
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

	private static Fixture() {
		return new FixtureFactory({ cwd: this.cwd })
	}
}
