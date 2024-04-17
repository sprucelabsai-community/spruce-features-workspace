import { test, assert } from '@sprucelabs/test-utils'
import AbstractStorePluginTest from '../../tests/AbstractStorePluginTest'

export default class GracefullyExitingOnErrorsTest extends AbstractStorePluginTest {
    protected static async beforeEach() {
        await super.beforeEach()
        this.cwd = this.resolvePath(
            __dirname,
            '..',
            'testDirsAndFiles',
            'empty-skill'
        )
    }

    @test()
    protected static async skillIsKilledDifferentFeatureCrash() {
        const skill = await this.Skill()

        void skill.registerFeature('test', {
            execute: async () => {
                throw new Error('crash!')
            },
            checkHealth: async () => ({ status: 'passed' }),
            onBoot: () => {},
            isInstalled: async () => true,
            isBooted: () => false,
            destroy: async () => {},
        })

        await assert.doesThrowAsync(() => skill.execute())
    }

    @test()
    protected static async skillIsKilledOnDifferentFeatureCrashWithDelay() {
        const skill = await this.Skill()

        void skill.registerFeature('test', {
            execute: async () => {
                await new Promise<void>((r) => setTimeout(r, 1000))
                throw new Error('crash!')
            },
            onBoot: () => {},
            checkHealth: async () => ({ status: 'passed' }),
            isInstalled: async () => true,
            isBooted: () => false,
            destroy: async () => {},
        })

        await assert.doesThrowAsync(() => skill.execute())
    }

    @test()
    protected static async shutsDownWithDatabaseError() {
        process.env.DB_CONNECTION_STRING = 'wakawaka'
        process.env.DB_NAME = 'wakawaka'
        const skill = await this.Skill()

        await assert.doesThrowAsync(() => skill.execute())
    }

    @test()
    protected static async shutsDownWhenMissingRequiredParams() {
        delete process.env.DB_CONNECTION_STRING
        delete process.env.DB_NAME

        const skill = await this.Skill()
        await assert.doesThrowAsync(() => skill.execute())
    }

    @test()
    protected static async shutsDownWithBadStore() {
        this.cwd = this.resolvePath(
            __dirname,
            '..',
            'testDirsAndFiles',
            'one-bad-store-skill'
        )

        const skill = await this.Skill()
        await assert.doesThrowAsync(() => skill.execute())
    }
}
