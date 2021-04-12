import { test, assert } from '@sprucelabs/test'
import { AbstractSkillTest } from '../..'
import ThrowingFeature from '../support/ThrowingFeature'

export default class UsingFeaturesTest extends AbstractSkillTest {
	@test()
	protected static async throwsWhenFeatureThrows() {
		const skill = await this.Skill()
		const throwing = new ThrowingFeature()

		await skill.registerFeature('test', throwing)

		const err = await assert.doesThrowAsync(() => skill.execute())

		assert.isEqual(err.message, 'throwing')
	}
}
