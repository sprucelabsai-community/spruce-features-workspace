import { plugin as eventPlugin } from '@sprucelabs/spruce-event-plugin'
import { SkillFactoryOptions } from '@sprucelabs/spruce-skill-booter'
import { AbstractSpruceFixtureTest } from '@sprucelabs/spruce-test-fixtures'
import plugin from '../plugins/view.plugin'

export default abstract class AbstractViewTest extends AbstractSpruceFixtureTest {
	protected static Skill(options?: SkillFactoryOptions) {
		const { plugins = [eventPlugin, plugin] } = options ?? {}

		return super.Skill({
			plugins,
			...options,
		})
	}

	protected static resolveTestPathSrc(...pathAfterTestDirsAndFiles: string[]) {
		return this.resolvePath(
			__dirname,
			'..',
			'..',
			'src',
			'__tests__',
			'testDirsAndFiles',
			...pathAfterTestDirsAndFiles
		)
	}
}
