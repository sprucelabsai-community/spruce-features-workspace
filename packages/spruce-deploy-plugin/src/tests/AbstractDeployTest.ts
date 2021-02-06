import { SkillFactoryOptions } from '@sprucelabs/spruce-skill-booter'
import { AbstractSpruceFixtureTest } from '@sprucelabs/spruce-test-fixtures'
import plugin from '../plugins/deploy.plugin'

export default abstract class AbstractDeployTest extends AbstractSpruceFixtureTest {
	protected static async afterAll() {
		delete process.env.HEROKU_APP_NAME
		delete process.env.HEROKU_API_TOKEN
		delete process.env.HEROKU_TEAM_NAME
	}

	protected static Skill(options?: SkillFactoryOptions) {
		const { plugins = [plugin] } = options ?? {}
		return super.Skill({
			plugins,
			...options,
		})
	}
}
