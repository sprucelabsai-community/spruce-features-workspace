import { testLog } from '@sprucelabs/spruce-skill-utils'
import {
	AbstractSpruceFixtureTest,
	SkillFactoryOptions,
} from '../../../spruce-test-fixtures/build'
import plugin, { EventFeaturePlugin } from './../plugins/event.plugin'

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

		EventFeaturePlugin.shouldClientUseEventContracts(false)
	}

	protected static Skill(options?: SkillFactoryOptions) {
		const { plugins = [plugin] } = options ?? {}
		return super.Skill({
			plugins,
			...options,
			log: testLog,
		})
	}

	protected static resolveTestPath(pathAfterTestDirsAndFiles: string) {
		return this.resolvePath(
			__dirname,
			'..',
			'__tests__',
			'testDirsAndFiles',
			pathAfterTestDirsAndFiles
		)
	}
}
