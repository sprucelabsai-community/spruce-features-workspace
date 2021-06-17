import { StoreLoader, StoreName, StoreOptions } from '@sprucelabs/data-stores'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import { AbstractSpruceFixtureTest } from '@sprucelabs/spruce-test-fixtures'

export default abstract class AbstractStoreTest extends AbstractSpruceFixtureTest {
	protected static storeDir: string = diskUtil.resolvePath(
		process.cwd(),
		'build'
	)

	protected static async beforeAll() {
		await super.beforeAll()

		const db = await this.Fixture('database').connectToDatabase()

		if (!this.storeDir) {
			throw new Error(
				`AbstractStoreTest needs \`protected static storeDir = diskUtil.resolvePath(__dirname,'..','..')\`. Make it point to the directory that contains the \`stores\` directory.`
			)
		}

		StoreLoader.setStoreDir(this.storeDir)
		StoreLoader.setDatabase(db)
	}

	protected static async beforeEach() {
		await super.beforeEach()

		const db = await this.Fixture('database').connectToDatabase()
		await db.dropDatabase()
	}

	protected static async connectToDatabase() {
		const dbFixture = this.Fixture('database')
		const db = await dbFixture.connectToDatabase()
		return db
	}

	protected static async Store<N extends StoreName, O extends StoreOptions<N>>(
		name: N,
		options?: O
	) {
		return this.Fixture('store').Store(name, options)
	}
}
