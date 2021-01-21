import {
	AbstractSpruceFixtureTest,
	SkillFactoryOptions,
} from '../../../spruce-test-fixtures/build'
import plugin from './../plugins/event.plugin'

export default class AbstractEventPluginTest extends AbstractSpruceFixtureTest {
	protected static async beforeEach() {
		await super.beforeEach()
		this.cwd = this.resolvePath(
			'build',
			'..',
			'..',
			'testDirsAndFiles',
			'skill'
		)
	}

	protected static Skill(options?: SkillFactoryOptions) {
		const { plugins = [plugin] } = options ?? {}
		return super.Skill({
			plugins,
			...options,
		})
	}
}
