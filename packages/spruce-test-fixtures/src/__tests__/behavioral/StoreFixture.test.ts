import { StoreLoader } from '@sprucelabs/data-stores'
import AbstractSpruceTest, { assert, test } from '@sprucelabs/test'
import FixtureFactory from '../../fixtures/FixtureFactory'

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
		assert.isTruthy(FixtureFactory.Fixture('store'))
	}

	@test()
	protected static async canGetFunctioningStores() {
		StoreLoader.setCwd(
			this.resolvePath(
				__dirname,
				'..',
				'testDirsAndFiles',
				'one-good-store-skill',
				'src'
			)
		)

		const dbFixture = FixtureFactory.Fixture('database')
		const db = await dbFixture.connectToDatabase()

		StoreLoader.setDatabase(db)

		const fixture = FixtureFactory.Fixture('store')
		const goodStore = await fixture.Store('good')
		assert.isTruthy(goodStore)
	}
}
