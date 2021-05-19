import { assert, test } from '@sprucelabs/test'
import AbstractSkillTest from '../../tests/AbstractSkillTest'

export default class BootingASkillTest extends AbstractSkillTest {
	@test()
	protected static async bootLoadsPluginsFromBuildDir() {
		await assert.doesThrowAsync(
			() => this.bootSkillFromTestDir('skill'),
			'LOADED CORRECTLY'
		)
	}
}
