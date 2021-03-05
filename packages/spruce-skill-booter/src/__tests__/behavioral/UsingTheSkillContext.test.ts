import { test, assert } from '@sprucelabs/test'
import AbstractSkillTest from '../../tests/AbstractSkillTest'

declare module '@sprucelabs/spruce-skill-utils/build/types/skill.types' {
	interface SkillContext {
		vcFactory: boolean
	}
}

export default class UsingTheSkillContextTest extends AbstractSkillTest {
	@test()
	protected static async contextIsEmptyObectToStart() {
		const skill = this.Skill()
		//@ts-ignore
		assert.isEqualDeep(skill.getContext(), {})
	}

	@test()
	protected static async canUpdateContext() {
		const skill = this.Skill()
		skill.updateContext('vcFactory', true)
		assert.isEqualDeep(skill.getContext(), { vcFactory: true })
	}
}
