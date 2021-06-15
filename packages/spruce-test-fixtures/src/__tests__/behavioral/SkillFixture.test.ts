import { eventErrorAssertUtil } from '@sprucelabs/spruce-event-utils'
import { test, assert } from '@sprucelabs/test'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import FixtureFactory from '../../tests/fixtures/FixtureFactory'
import SkillFixture from '../../tests/fixtures/SkillFixture'

export default class SkillFixtureTest extends AbstractSpruceFixtureTest {
	private static fixture: SkillFixture

	protected static async beforeEach() {
		this.fixture = FixtureFactory.Fixture('skill')
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

		eventErrorAssertUtil.assertErrorFromResponse(results, 'INVALID_TARGET')
	}
}
