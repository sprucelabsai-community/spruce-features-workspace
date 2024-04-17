import { SkillFactoryOptions } from '@sprucelabs/spruce-skill-booter'
import { AbstractSpruceFixtureTest } from '@sprucelabs/spruce-test-fixtures'
import plugin from '../plugins/store.plugin'

export default abstract class AbstractStorePluginTest extends AbstractSpruceFixtureTest {
    protected static async connectToDatabase() {
        const db = await this.Fixture('database').connectToDatabase()
        return db
    }

    protected static Skill(options?: SkillFactoryOptions) {
        const { plugins = [plugin] } = options ?? {}

        return super.Skill({
            plugins,
            ...options,
        })
    }
}
