import { StoreName, StoreOptions } from '@sprucelabs/data-stores'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import {
	AbstractSpruceFixtureTest,
	StoreFixture,
} from '@sprucelabs/spruce-test-fixtures'

export default abstract class AbstractStoreTest extends AbstractSpruceFixtureTest {
	protected static storeDir: string = diskUtil.resolvePath(
		process.cwd(),
		'build'
	)
	private static storeFixture: StoreFixture

	protected static async connectToDatabase() {
		return this.Fixture('database').connectToDatabase()
	}

	protected static async Store<N extends StoreName, O extends StoreOptions<N>>(
		name: N,
		options?: O
	) {
		if (!this.storeFixture) {
			this.storeFixture = new StoreFixture()
		}

		return this.storeFixture.Store(name, options)
	}
}
