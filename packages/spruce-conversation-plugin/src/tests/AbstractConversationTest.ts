import { plugin as eventPlugin } from '@sprucelabs/spruce-event-plugin'
import { SkillFactoryOptions } from '@sprucelabs/spruce-skill-booter'
import { AbstractSpruceFixtureTest } from '@sprucelabs/spruce-test-fixtures'
import plugin from '../plugins/conversation.plugin'
import { Message } from '../types/conversation.types'
import messageTestUtility from './messageTest.utility'

export default abstract class AbstractConversationTest extends AbstractSpruceFixtureTest {
    protected static async beforeEach() {
        await super.beforeEach()
        this.resetEnv()
    }

    protected static buildMessage<T extends Partial<Message>>(
        values: T
    ): Message & T {
        return messageTestUtility.buildMessage(values)
    }

    protected static async afterEach() {
        await super.afterEach()
        this.resetEnv()
    }

    private static resetEnv() {
        delete process.env.SKILL_ID
        delete process.env.SKILL_API_KEY
        delete process.env.ACTION
        delete process.env.FIRST_MESSAGE
    }

    protected static async Skill(options?: SkillFactoryOptions) {
        const { plugins = [eventPlugin, plugin] } = options ?? {}
        return super.Skill({
            plugins,
            ...options,
        })
    }

    protected static resolveTestPath(...pathAfterTestDirsAndFiles: string[]) {
        return this.resolvePath(
            __dirname,
            '..',
            '__tests__',
            'testDirsAndFiles',
            ...pathAfterTestDirsAndFiles
        )
    }
}
