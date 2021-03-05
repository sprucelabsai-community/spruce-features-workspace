import { test, assert } from '@sprucelabs/test'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'

export default class AddsMercuryToTheSkillContextTest extends AbstractEventPluginTest {
	@test()
	protected static async addsMercuryToContext() {
		const skill = await this.bootTestSkillAndWait('skill')
		const context = skill.getContext()
		assert.isTruthy(context.mercury)
	}
}
