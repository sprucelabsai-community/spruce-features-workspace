import { assert, test } from '@sprucelabs/test-utils'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'

export default class DidBootFiresAfterSkillIsBootedTest extends AbstractEventPluginTest {
	@test()
	protected static async willBootCanFireFirstAndConfigureMercury() {
		const skill = await this.SkillFromTestDir('skill-did-boot-event')
		let isBooted = false
		let cb: () => void

		skill.registerFeature('test', {
			execute: async () => {
				await new Promise<void>((r) => setTimeout(r, 1000))
				isBooted = true
				cb()
			},
			onBoot: (_cb: () => void) => {
				cb = _cb
			},
			checkHealth: async () => ({ status: 'passed' }),
			isInstalled: async () => true,
			isBooted: () => isBooted,
			destroy: async () => {},
		})

		const promise = skill.execute()

		do {
			await this.wait(100)
			assert.isNotEqual(process.env.DID_BOOT_LATE, 'true')
		} while (skill.isRunning() && process.env.DID_BOOT_EARLY !== 'true')

		await promise

		assert.isEqual(process.env.DID_BOOT_LATE, 'true')
	}
}
