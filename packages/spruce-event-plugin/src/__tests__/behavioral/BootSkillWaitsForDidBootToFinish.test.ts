import { test, assert } from '@sprucelabs/test-utils'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'

export default class BootSkillWaitsForDidBootToFinishTest extends AbstractEventPluginTest {
	@test()
	protected static async canCreateBootSkillWaitsForDidBootToFinish() {
		await this.bootSkillFromTestDir('skill-did-boot-event')
		assert.isEqual(process.env.DID_BOOT_LATE, 'true')
	}

	@test()
	protected static async throwingInDidBootErrorsBoot() {
		await assert.doesThrowAsync(() =>
			this.bootSkillFromTestDir('registered-skill-throw-in-did-boot-listener')
		)
	}
}
