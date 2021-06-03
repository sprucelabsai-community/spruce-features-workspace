import { SkillFactoryOptions } from '@sprucelabs/spruce-skill-booter'
import { AbstractSpruceFixtureTest } from '@sprucelabs/spruce-test-fixtures'
import plugin from '../plugins/view.plugin'

export default abstract class AbstractViewTest extends AbstractSpruceFixtureTest {
	protected static Skill(options?: SkillFactoryOptions) {
		const { plugins = [plugin] } = options ?? {}

		return super.Skill({
			plugins,
			...options,
		})
	}
}
