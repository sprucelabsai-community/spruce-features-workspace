import { test, assert } from '@sprucelabs/test'
import FixtureFactory from '../../fixtures/FixtureFactory'
import { SkillFixture } from '../../fixtures/SkillFixture'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'

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
	protected static async fixtureDestroysDependencies() {
		const { client } = await this.Fixture('person').loginAsDemoPerson()

		await this.fixture.destory()

		assert.isFalse(client.isConnected())
	}
}
