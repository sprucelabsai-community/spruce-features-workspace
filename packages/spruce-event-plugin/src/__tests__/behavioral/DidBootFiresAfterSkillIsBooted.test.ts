import { test } from '@sprucelabs/test'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'

export default class DidBootFiresAfterSkillIsBootedTest extends AbstractEventPluginTest {
	@test()
	protected static async willBootCanFireFirstAndConfigureMercury() {
		const skill = this.SkillFromTestDir('skill-did-boot-event')
		let isBooted = false

		void skill.registerFeature('test', {
			execute: async () => {
				await new Promise((r) => setTimeout(r, 1000))
				isBooted = true
			},
			checkHealth: async () => ({ status: 'passed' }),
			isInstalled: async () => true,
			isBooted: () => isBooted,
			destroy: async () => {},
		})

		void skill.execute()
		await this.waitUntilSkillIsBooted(skill)
	}
}
