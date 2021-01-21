import Skill from '@sprucelabs/spruce-skill-booter'
import AbstractSpruceTest from '@sprucelabs/test'
import FixtureFactory from '../fixtures/FixtureFactory'
import { FixtureName, SkillFactoryOptions } from '../types/fixture.types'

export default abstract class AbstractSpruceFixtureTest extends AbstractSpruceTest {
	protected static skills: Skill[] = []

	protected static async afterEach() {
		await super.afterEach()
		await FixtureFactory.destroy()
		for (const skill of this.skills) {
			await skill.kill()
		}
		this.skills = []
	}

	protected static Fixture<Name extends FixtureName>(name: Name) {
		return FixtureFactory.Fixture(name)
	}

	protected static Skill(options?: SkillFactoryOptions) {
		const { plugins = [] } = options ?? {}

		const skill = new Skill({
			rootDir: this.cwd,
			activeDir: this.resolvePath('src'),
			hashSpruceDir: this.cwd,
			...options,
		})

		for (const plugin of plugins) {
			void plugin(skill)
		}

		this.skills.push(skill)

		return skill
	}
}
