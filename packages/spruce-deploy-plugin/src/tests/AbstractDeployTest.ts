import { AbstractSpruceFixtureTest } from '@sprucelabs/spruce-test-fixtures'
import { SkillFactoryOptions } from '@sprucelabs/spruce-test-fixtures'
import plugin from '../plugins/deploy.plugin'

export default abstract class AbstractDeployTest extends AbstractSpruceFixtureTest {
	protected static Skill(options?: SkillFactoryOptions) {
		const { plugins = [plugin] } = options ?? {}
		return super.Skill({
			plugins,
			...options,
		})
	}
}
