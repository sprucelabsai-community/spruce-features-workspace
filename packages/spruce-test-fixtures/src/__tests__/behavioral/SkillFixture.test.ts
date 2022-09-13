import {
	eventAssertUtil,
	eventResponseUtil,
} from '@sprucelabs/spruce-event-utils'
import { test, assert } from '@sprucelabs/test-utils'
import { errorAssert } from '@sprucelabs/test-utils'
import { login } from '../..'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import { DEMO_NUMBER_SKILL_FIXTURE } from '../../tests/constants'
import SkillFixture from '../../tests/fixtures/SkillFixture'

@login(DEMO_NUMBER_SKILL_FIXTURE)
export default class SkillFixtureTest extends AbstractSpruceFixtureTest {
	private static fixture: SkillFixture

	protected static async beforeEach() {
		await super.beforeEach()
		this.fixture = this.Fixture('skill')
		delete process.env.SKILL_ID
		delete process.env.SKILL_API_KEY
	}

	@test()
	protected static async canCreateSkillFixture() {
		assert.isTruthy(this.fixture)
	}

	@test()
	protected static async canSeedSkill() {
		const skill = await this.fixture.seedDemoSkill({
			name: 'skill1',
		})
		assert.isTruthy(skill)
		assert.isEqual(skill.name, 'skill1')
	}

	@test()
	protected static async cleansUpSkillsAndNotCrashWithMultileDestroys() {
		const skill = await this.fixture.seedDemoSkill({
			name: 'skill1',
		})

		await this.fixture.destroy()
		await this.fixture.destroy()

		const client = await this.Fixture('mercury').connectToApi()

		const results = await client.emit('get-skill::v2020_12_25', {
			target: {
				skillId: skill.id,
			},
		})

		eventAssertUtil.assertErrorFromResponse(results, 'INVALID_TARGET')
	}

	@test()
	protected static async cantLoginAsCurrentSkillIfSkillNotConfigured() {
		const err = await assert.doesThrowAsync(() =>
			this.fixture.loginAsCurrentSkill()
		)

		errorAssert.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['env.SKILL_ID', 'env.SKILL_API_KEY'],
		})
	}

	@test()
	protected static async cantLoginAsCurrentSkillIfSkillNotConfiguredWithApiKey() {
		process.env.SKILL_ID = '123'

		const err = await assert.doesThrowAsync(() =>
			this.fixture.loginAsCurrentSkill()
		)

		errorAssert.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['env.SKILL_API_KEY'],
		})
	}

	@test()
	protected static async canLoginAsCurrentSkill() {
		const { skill: demoSkill } = await this.fixture.loginAsDemoSkill({
			name: 'Demo me!',
		})

		process.env.SKILL_ID = demoSkill.id
		process.env.SKILL_API_KEY = demoSkill.apiKey

		const { skill, client } = await this.fixture.loginAsCurrentSkill()

		assert.isTruthy(skill)
		assert.isTruthy(client)

		assert.isEqual(skill.id, demoSkill.id)
		assert.isEqual(skill.apiKey, demoSkill.apiKey)
	}

	@test()
	protected static async shouldUnRegisterDemoSkills() {
		const { client } = await this.fixture.loginAsDemoSkill({
			name: 'Demo me!',
		})

		await this.fixture.destroy()

		const results = await client.emit('whoami::v2020_12_25')

		assert.doesThrow(() => eventResponseUtil.getFirstResponseOrThrow(results))
	}

	@test()
	protected static canPassThroughPersonFixture() {
		const personFixture = this.Fixture('person')
		const fixture = this.Fixture('skill', { personFixture })

		//@ts-ignore
		assert.isEqual(fixture.personFixture, personFixture)
	}
}
