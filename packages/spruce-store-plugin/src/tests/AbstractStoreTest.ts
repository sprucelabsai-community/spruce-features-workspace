import { SkillFactoryOptions } from '@sprucelabs/spruce-skill-booter'
import { AbstractSpruceFixtureTest } from '@sprucelabs/spruce-test-fixtures'
import plugin from '../plugins/store.plugin'

export default abstract class AbstractStoreTest extends AbstractSpruceFixtureTest {
	protected static async beforeEach() {
		await super.beforeEach()
		process.env.DB_CONNECTION_STRING = 'memory://'
		process.env.DB_NAME = 'mercury '
	}

	protected static Skill(options?: SkillFactoryOptions) {
		const { plugins = [plugin] } = options ?? {}

		return super.Skill({
			plugins,
			...options,
		})
	}

	protected static SkillFromTestDir(key: string) {
		this.cwd = this.resolvePath(
			__dirname,
			'..',
			'__tests__',
			'/testDirsAndFiles/',
			key
		)

		const skill = this.Skill()

		return skill
	}
}
