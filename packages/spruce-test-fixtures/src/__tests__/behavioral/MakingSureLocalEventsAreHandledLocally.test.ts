import { MercuryTestClient } from '@sprucelabs/mercury-client'
import { AuthService } from '@sprucelabs/spruce-skill-utils'
import { assert, test } from '@sprucelabs/test'
import { AbstractSpruceFixtureTest, login, MercuryFixture } from '../..'
import { DEMO_NUMBER_HANDLING_EVENTS_LOCALLY } from '../../tests/constants'

@login(DEMO_NUMBER_HANDLING_EVENTS_LOCALLY)
export default class MakingSureLocalEventsAreHandledLocallyTest extends AbstractSpruceFixtureTest {
	@test()
	protected static async throwsWhenNoListenerSetForLocalEvent() {
		await this.SkillFromTestDir('skill')

		const skill = await this.Fixture('skill').seedDemoSkill()

		AuthService.Auth(this.cwd).updateCurrentSkill(skill)

		await MercuryFixture.beforeEach(this.cwd)

		assert.isEqualDeep(
			MercuryTestClient.getNamespacesThatMustBeHandledLocally(),
			[skill.slug]
		)
	}
}
