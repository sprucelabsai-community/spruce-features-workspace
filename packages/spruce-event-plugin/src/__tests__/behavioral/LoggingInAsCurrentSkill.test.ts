import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { test, assert } from '@sprucelabs/test'
import { EventFeaturePlugin } from '../../plugins/event.plugin'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'

export default class LoggingInAsCurrentSkillTest extends AbstractEventPluginTest {
	@test()
	protected static async logsInAnonByDefault() {
		const results = await this.login()
		const { type } = eventResponseUtil.getFirstResponseOrThrow(results)
		assert.isEqual(type, 'anonymous')
	}

	@test()
	protected static async logsInAsSkillIfEnvVarsAreSet() {
		const skill = await this.Fixture('skill').seedDemoSkill({
			name: 'event test skill',
		})

		process.env.SKILL_ID = skill.id
		process.env.SKILL_API_KEY = skill.apiKey

		const results = await this.login()

		const { type, auth } = eventResponseUtil.getFirstResponseOrThrow(results)
		assert.isEqual(type, 'authenticated')

		assert.isEqual(auth.skill.id, skill.id)
	}

	@test()
	protected static async failingToConnectLetsYouTryAgain() {
		process.env.SKILL_ID = 'aosenuth'
		process.env.SKILL_API_KEY = 'aosenuth'

		const runningSkill = this.Skill()
		const feature = runningSkill.getFeatureByCode('event') as EventFeaturePlugin

		await assert.doesThrowAsync(() => feature.connectToApi())

		const skill = await this.Fixture('skill').seedDemoSkill({
			name: 'event test skill',
		})

		process.env.SKILL_ID = skill.id
		process.env.SKILL_API_KEY = skill.apiKey

		await feature.connectToApi()
	}

	private static async login() {
		const skill = this.Skill()
		const feature = skill.getFeatureByCode('event') as EventFeaturePlugin
		const client = await feature.connectToApi()
		const results = await client.emit('whoami::v2020_12_25')
		return results
	}
}
