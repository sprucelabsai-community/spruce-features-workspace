import { plugin as eventPlugin } from '@sprucelabs/spruce-event-utils'
import Skill from '@sprucelabs/spruce-skill-utils'
import { AbstractSpruceFixtureTest } from '@sprucelabs/spruce-test-fixtures'
import plugin from '../plugins/conversation.plugin'



export default abstract class AbstractConversationTest extends AbstractSpruceFixtureTest {
	protected static Skill(options?: SkillFactoryOptions) {
		const { plugins = [eventPlugin, plugin] } = options ?? {}

		const skill = new Skill({
			rootDir: this.cwd,
			activeDir: this.resolvePath('src'),
			hashSpruceDir: this.cwd,
			...options,
		})

		for (const plugin of plugins) {
			plugin(skill)
		}

		return skill
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
