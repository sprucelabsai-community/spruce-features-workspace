import { StoreName, StoreOptions } from '@sprucelabs/data-stores'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import { StoreFixture } from '@sprucelabs/spruce-test-fixtures'
import { AbstractSkillTest } from '../../../spruce-skill-booter/build'

export default abstract class AbstractStoreTest extends AbstractSkillTest {
	protected static storeDir: string = diskUtil.resolvePath(
		process.cwd(),
		'build'
	)
	private static storeFixture: StoreFixture

	protected static async beforeAll() {
		await super.beforeAll()
		await StoreFixture.beforeAll()
	}

	protected static async beforeEach() {
		await StoreFixture.beforeEach()
	}

	protected static async connectToDatabase() {
		return StoreFixture.DatabaseFixture().connectToDatabase()
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
