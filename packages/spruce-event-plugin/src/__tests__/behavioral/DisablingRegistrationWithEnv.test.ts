import { assert, test } from '@sprucelabs/test-utils'
import { EventFeaturePlugin } from '../../plugins/event.plugin'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'

export default class DisablingRegistrationWithEnv extends AbstractEventPluginTest {
	@test()
	public static async wontLoadAnythingWithEnvSet() {
		process.env.SHOULD_REGISTER_EVENTS_AND_LISTENERS = 'false'

		const skill = await this.Skill({
			plugins: [
				(skill) => {
					const events = new ExplodingEventFeature(skill)
					skill.registerFeature('event', events)
				},
			],
		})

		await this.bootSkill({ skill })
	}
}

class ExplodingEventFeature extends EventFeaturePlugin {
	public async loadEvents() {
		assert.fail(`don't call loadEvents!`)
		return super.loadEvents()
	}

	public async registerListeners() {
		assert.fail("don't call registerListeners")
		return super.registerListeners()
	}
}
