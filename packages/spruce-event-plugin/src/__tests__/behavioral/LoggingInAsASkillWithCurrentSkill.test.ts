import { test, assert } from '@sprucelabs/test-utils'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'

export default class LoggingInAsASkillWithCurrentSkillTest extends AbstractEventPluginTest {
	protected static async beforeEach(): Promise<void> {
		await super.beforeEach()
		await this.SkillFromTestDir('registered-skill')
		await this.registerCurrentSkill()
	}

	@test()
	protected static async loggingInAsDemoSkillWorksAsExpected() {
		const { client, skill } = await this.Fixture('skill').loginAsDemoSkill({
			name: 'a different skill',
		})

		//@ts-ignore
		assert.isEqual(client.auth.skill.id, skill.id)
	}
}
