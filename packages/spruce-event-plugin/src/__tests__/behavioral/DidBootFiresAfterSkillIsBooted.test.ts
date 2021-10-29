import { test } from '@sprucelabs/test'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'

export default class DidBootFiresAfterSkillIsBootedTest extends AbstractEventPluginTest {
	@test()
	protected static async willBootCanFireFirstAndConfigureMercury() {
		const skill = await this.SkillFromTestDir('skill-did-boot-event')
		let isBooted = false
		let cb: () => void

		void skill.registerFeature('test', {
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

		await this.bootSkill({ skill })
	}
}
