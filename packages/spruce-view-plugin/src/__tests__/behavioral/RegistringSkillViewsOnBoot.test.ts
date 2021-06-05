import { MercuryClient } from '@sprucelabs/mercury-client'
import { EventFeature } from '@sprucelabs/spruce-event-plugin'
import { test, assert } from '@sprucelabs/test'
import AbstractViewTest from '../../tests/AbstractViewTest'
import { CoreEventContract } from '../../tests/events.contract'

export default class RegistringSkillViewsOnBootTest extends AbstractViewTest {
	@test()
	protected static async registersNothingToStart() {
		const currentSkill = await this.Fixture('skill').seedDemoSkill({
			name: 'my skill with events',
		})

		process.env.SKILL_ID = currentSkill.id
		process.env.SKILL_API_KEY = currentSkill.apiKey

		const skill = await this.bootSkill()
		const events = skill.getFeatureByCode('event') as EventFeature
		const client = await events.connectToApi() as MercuryClient<CoreEventContract>

		const results = await client.emit('hea')

		debugger
	}
}
