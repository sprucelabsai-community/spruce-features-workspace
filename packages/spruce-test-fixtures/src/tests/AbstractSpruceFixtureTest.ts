import Skill from '@sprucelabs/spruce-skill-utils'
import AbstractSpruceTest from '@sprucelabs/test'
import FixtureFactory from '../fixtures/FixtureFactory'
import { FixtureName, SkillFactoryOptions } from '../types/fixture.types'

export default abstract class AbstractSpruceFixtureTest extends AbstractSpruceTest {
	protected static async afterEach() {
		await super.afterEach()
		await FixtureFactory.destroy()
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

		return skill
	}
}
