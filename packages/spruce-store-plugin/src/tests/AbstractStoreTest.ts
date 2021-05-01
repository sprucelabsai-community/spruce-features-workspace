import { StoreLoader } from '@sprucelabs/data-stores'
import { SkillFactoryOptions } from '@sprucelabs/spruce-skill-booter'
import { AbstractSpruceFixtureTest } from '@sprucelabs/spruce-test-fixtures'
import plugin from '../plugins/store.plugin'

export default abstract class AbstractStoreTest extends AbstractSpruceFixtureTest {
	protected static async beforeAll() {
		await super.beforeAll()

		const db = await this.Fixture('database').connectToDatabase()
		const cwd = this.resolvePath(__dirname, '../')

		StoreLoader.setCwd(cwd)
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

	protected static Skill(options?: SkillFactoryOptions) {
		const { plugins = [plugin] } = options ?? {}

		return super.Skill({
			plugins,
			...options,
		})
	}
}
