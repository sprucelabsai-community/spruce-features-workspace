import { buildLog, diskUtil } from '@sprucelabs/spruce-skill-utils'
import { test, assert } from '@sprucelabs/test-utils'
import { errorAssert } from '@sprucelabs/test-utils'
import Skill from '../../skills/Skill'
import AbstractSkillTest from '../../tests/AbstractSkillTest'

export default class SkillTest extends AbstractSkillTest {
    @test()
    protected static async canCreatSkill() {
        const skill = new Skill({
            rootDir: this.cwd,
            activeDir: diskUtil.resolvePath(this.cwd, 'src'),
            hashSpruceDir: diskUtil.resolvePath(this.cwd, 'src', '.spruce'),
        })
        assert.isTruthy(skill)
    }

    @test()
    protected static async throwsWhenCantFindFeatureByCode() {
        const skill = await this.Skill()
        const err = assert.doesThrow(() => skill.getFeatureByCode('unknown'))

        errorAssert.assertError(err, 'INVALID_FEATURE_CODE', {
            suppliedCode: 'unknown',
            validCodes: [],
        })
    }

    @test()
    protected static async throwReturnsValidCodes() {
        const skill = await this.Skill()

        //@ts-ignore
        skill.registerFeature('test', {})

        const err = assert.doesThrow(() => skill.getFeatureByCode('unknown'))

        errorAssert.assertError(err, 'INVALID_FEATURE_CODE', {
            suppliedCode: 'unknown',
            validCodes: ['test'],
        })
    }

    @test()
    protected static async canGetFeatureByCode() {
        const skill = await this.Skill()

        //@ts-ignore
        skill.registerFeature('test', { test: true })

        const match = skill.getFeatureByCode('test')

        //@ts-ignore
        assert.isEqualDeep(match, { test: true })
    }

    @test()
    protected static async skillMarksAsRunning() {
        const skill = await this.Skill()

        assert.isFalse(skill.isRunning())

        void skill.execute()

        assert.isTrue(skill.isRunning())

        await skill.kill()

        assert.isFalse(skill.isRunning())
    }

    @test()
    protected static async skillMarksAsDoneRunningWhenFinished() {
        const skill = await this.Skill()
        await skill.execute()
        assert.isFalse(skill.isRunning())
    }

    @test()
    protected static async killDestroysFeatures() {
        const skill = await this.Skill()
        let wasDestroyCalled = false

        skill.registerFeature('test', {
            execute: async () => {},
            onBoot: () => {},
            checkHealth: async () => ({ status: 'passed' }),
            isInstalled: async () => true,
            isBooted: () => false,
            destroy: async () => {
                wasDestroyCalled = true
            },
        })

        void skill.execute()

        await skill.kill()

        assert.isTrue(wasDestroyCalled)
    }

    @test()
    protected static async isBootedRightAwayIfNoFeatures() {
        const skill = await this.Skill()
        void skill.execute()

        assert.isTrue(skill.isBooted())

        await skill.kill()
    }

    @test()
    protected static async countsItselfAsBootedWhenAllFeaturesAreBooted() {
        const skill = await this.Skill()

        let markAsBooted = false

        skill.registerFeature('test', {
            execute: async () => {},
            checkHealth: async () => ({ status: 'passed' }),
            isInstalled: async () => true,
            isBooted: () => markAsBooted,
            onBoot: () => {},
            destroy: async () => {},
        })

        void skill.execute()

        assert.isFalse(skill.isBooted())

        markAsBooted = true

        assert.isTrue(skill.isBooted())

        await skill.kill()
    }

    @test()
    protected static async logsSkillBootedWhenBooted() {
        let log = ''

        const skill = await this.Skill({
            log: {
                prefix: '',
                warn: () => '',
                info: (data) => (log += data),
                error: () => '',
                buildLog,
            },
        })

        let cb = () => {}

        skill.registerFeature('test', {
            execute: async () =>
                await new Promise(() => {
                    cb()
                }),
            checkHealth: async () => ({ status: 'passed' }),
            onBoot: (_cb: () => void) => {
                cb = _cb
            },
            isBooted: () => true,
            destroy: async () => {},
            isInstalled: async () => true,
        })

        await this.bootSkill({ skill })

        assert.isAbove(log.search('Skill booted'), -1)
    }

    @test()
    protected static async abstractSkillTestBootCrashesIfFeatureThrows() {
        const err = await assert.doesThrowAsync(() =>
            this.bootSkill({
                plugins: [
                    (skill) => {
                        skill.registerFeature('test', {
                            execute: async () => {
                                throw new Error('test')
                            },
                            onBoot: () => {},
                            checkHealth: async () => ({ status: 'passed' }),
                            isInstalled: async () => true,
                            isBooted: () => false,
                            destroy: async () => {},
                        })
                    },
                ],
            })
        )

        assert.doesInclude(err.message, 'test')
    }
}
