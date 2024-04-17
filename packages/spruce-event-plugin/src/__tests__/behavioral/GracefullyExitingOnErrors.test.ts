import '@sprucelabs/mercury-core-events'
import { MercuryFixture } from '@sprucelabs/spruce-test-fixtures'
import { test, assert } from '@sprucelabs/test-utils'
import { errorAssert } from '@sprucelabs/test-utils'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'

MercuryFixture.setShouldRequireLocalListeners(false)

export default class GracefullyExitingOnErrorsTest extends AbstractEventPluginTest {
    @test()
    protected static async skillIsKilledOnAuthError() {
        this.cwd = this.resolveTestPath('skill')

        process.env.SKILL_ID = '234'
        process.env.SKILL_API_KEY = '234234'

        const { skill } = await this.bootSkill({
            shouldSuppressBootErrors: true,
        })

        const err = this.skillBootError

        this.clearSkillBootErrors()

        assert.isFalse(skill.isRunning())

        assert.isTruthy(err, "Skill didn't error as expected")
        errorAssert.assertError(err, 'MERCURY_RESPONSE_ERROR')
    }

    @test()
    protected static async skillIsKilledWhenDifferentFeatureCrashes() {
        const skill = await this.SkillFromTestDir(
            'registered-skill-boot-events'
        )

        delete process.env.SKILL_ID
        delete process.env.SKILL_API_KEY

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

        await assert.doesThrowAsync(() => skill.execute(), 'crash')
    }

    @test()
    protected static async throwsIfHostNotSet() {
        delete process.env.HOST

        const err = await assert.doesThrowAsync(() => this.bootSkill())

        errorAssert.assertError(err, 'MISSING_PARAMETERS', {
            parameters: ['env.HOST'],
        })
    }

    @test()
    protected static async throwsWhenRegisteringBadContract() {
        this.cwd = await this.generateSkillFromTestPath(
            'registered-skill-bad-signature'
        )

        const { skill } = await this.Fixture('skill').loginAsDemoSkill({
            name: 'boot-events',
        })

        process.env.SKILL_ID = skill.id
        process.env.SKILL_API_KEY = skill.apiKey

        this.generateGoodContractFileForSkill(skill)
        this.setupListenersForEventsRegisteredBySkill(skill)

        const err = await assert.doesThrowAsync(() => this.bootSkill())

        errorAssert.assertError(err, 'INVALID_PAYLOAD')
    }

    @test()
    protected static async throwsWhenRegisteringBadContractIgnoringBadListenerError() {
        this.cwd = await this.generateSkillFromTestPath(
            'registered-skill-bad-signature'
        )

        const { skill } = await this.Fixture('skill').loginAsDemoSkill({
            name: 'boot-events',
        })

        process.env.SKILL_ID = skill.id
        process.env.SKILL_API_KEY = skill.apiKey

        this.generateGoodContractFileForSkill(skill)
        this.setupListenersForEventsRegisteredBySkill(skill)

        const booted = await this.Skill()

        const err = await assert.doesThrowAsync(() => booted.execute())
        errorAssert.assertError(err, 'INVALID_PAYLOAD')
    }

    @test()
    protected static async executeThrowsOnLateDidBoot() {
        const skill = await this.SkillFromTestDir('skill-did-boot-throws')
        const err = await assert.doesThrowAsync(() => skill.execute())

        assert.doesInclude(err.message, 'what the!')
    }

    private static setupListenersForEventsRegisteredBySkill(skill: any) {
        this.EventFixture().setupListeners(skill.slug)
    }
}
