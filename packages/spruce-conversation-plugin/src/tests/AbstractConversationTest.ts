import { plugin as eventPlugin } from '@sprucelabs/spruce-event-plugin'
import { AbstractSpruceFixtureTest } from '@sprucelabs/spruce-test-fixtures'
import { SkillFactoryOptions } from '@sprucelabs/spruce-test-fixtures'
import plugin from '../plugins/conversation.plugin'

export default abstract class AbstractConversationTest extends AbstractSpruceFixtureTest {
	protected static Skill(options?: SkillFactoryOptions) {
		const { plugins = [eventPlugin, plugin] } = options ?? {}
		return super.Skill({
			plugins,
			...options,
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
