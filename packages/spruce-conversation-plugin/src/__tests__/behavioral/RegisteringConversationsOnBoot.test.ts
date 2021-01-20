import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import { test, assert } from '@sprucelabs/test'
import { errorAssertUtil } from '@sprucelabs/test-utils'
import plugin from '../../plugins/conversation.plugin'
import AbstractConversationTest from '../../tests/AbstractConversationTest'

export default class RegisteringConversationsOnBootTest extends AbstractConversationTest {
	@test()
	protected static async throwsWhenExecutingIfEventPluginMissing() {
		const skill = this.Skill({ plugins: [plugin] })
		const err = await assert.doesThrowAsync(() => skill.execute())

		errorAssertUtil.assertError(err, 'MISSING_DEPENDENCIES', {
			dependencies: ['event.plugin'],
		})
	}

	@test()
	protected static async registersConvosOnBoot() {
		this.cwd = diskUtil.createRandomTempDir()

		await diskUtil.copyDir(
			this.resolveTestPath('good'),
			diskUtil.resolvePath(this.cwd, 'src')
		)

		const registeredSkill = await this.Fixture('skill').seedDemoSkill({
			name: 'my great skill',
		})

		process.env.SKILL_ID = registeredSkill.id
		process.env.API_KEY = registeredSkill.apiKey

		const skill = this.Skill()

		void skill.execute()

		await skill.kill()
	}
}
