import { plugin as eventPlugin } from '@sprucelabs/spruce-event-plugin'
import { SkillFactoryOptions } from '@sprucelabs/spruce-skill-booter'
import { AbstractSpruceFixtureTest } from '@sprucelabs/spruce-test-fixtures'
import plugin from '../plugins/conversation.plugin'

export default abstract class AbstractConversationTest extends AbstractSpruceFixtureTest {
	protected static async beforeEach() {
		await super.beforeEach()

		delete process.env.SKILL_ID
		delete process.env.SKILL_API_KEY
		delete process.env.ACTION
		delete process.env.FIRST_MESSAGE
	}

	protected static Skill(options?: SkillFactoryOptions) {
		const { plugins = [eventPlugin, plugin] } = options ?? {}
		return super.Skill({
			plugins,
			...options,
		})
	}

	protected static resolveTestPath(...pathAfterTestDirsAndFiles: string[]) {
		return this.resolvePath(
			__dirname,
			'..',
			'__tests__',
			'testDirsAndFiles',
			...pathAfterTestDirsAndFiles
		)
	}
}
