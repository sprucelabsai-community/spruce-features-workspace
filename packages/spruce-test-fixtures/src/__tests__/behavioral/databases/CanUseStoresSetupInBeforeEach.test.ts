import { test, assert } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import seed from '../../../tests/decorators/seed'
import StoreFixture from '../../../tests/fixtures/StoreFixture'
// eslint-disable-next-line spruce/prohibit-import-from-build-folder
import GoodStore from '../../testDirsAndFiles/one-good-store-skill/build/stores/Good.store'

export default class CanUseStoresSetupInBeforeEachTest extends AbstractSpruceFixtureTest {
	private static goodStore: GoodStore

	protected static async beforeEach() {
		await super.beforeEach()

		this.goodStore = await this.Fixture('store').Store('good')
	}

	@test()
	@seed('good', 3)
	protected static async shouldNotLoseData() {
		const count = await this.goodStore.count({})
		assert.isEqual(count, 3)
	}

	@test()
	@seed('good', 10)
	protected static async shouldNotLoseData2() {
		const count = await this.goodStore.count({})
		assert.isEqual(count, 10)
	}
}

StoreFixture.setStore('good', GoodStore)
