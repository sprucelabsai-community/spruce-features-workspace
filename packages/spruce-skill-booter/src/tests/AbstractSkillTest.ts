import { mockLog } from '@sprucelabs/spruce-skill-utils'
import AbstractSpruceTest, { assert } from '@sprucelabs/test'
import Skill from '../skills/Skill'
import { SkillFactoryOptions } from '../types/skill.types'

export default class AbstractSkillTest extends AbstractSpruceTest {
	protected static skills: Skill[] = []
	private static skillBootError?: any

	protected static async afterEach() {
		await super.afterEach()

		for (const skill of this.skills) {
			await skill.kill()
		}

		this.skills = []

		if (this.skillBootError) {
			const err = this.skillBootError

			this.clearSkillBootErrors()

			assert.fail('Skill had error during boot:\n\n' + err.toString())
		}
	}

	protected static clearSkillBootErrors() {
		this.skillBootError = undefined
	}

	protected static Skill(options?: SkillFactoryOptions) {
		const { plugins = [], log = mockLog } = options ?? {}

		const skill = new Skill({
			rootDir: this.cwd,
			shouldCountdownOnExit: false,
			activeDir: this.resolvePath('src'),
			hashSpruceDir: this.cwd,
			log,
			...options,
		})

		for (const plugin of plugins) {
			void plugin(skill)
		}

		this.skills.push(skill)

		return skill
	}

	protected static async bootSkill(options?: SkillFactoryOptions) {
		const skill = this.Skill(options)

		void skill.execute().catch((err) => {
			this.skillBootError = err
		})

		do {
			await this.wait(100)
		} while (!skill.isBooted() && skill.isRunning())

		return skill
	}
}
