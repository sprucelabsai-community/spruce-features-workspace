import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { assert, suite, test } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import { DEMO_NUMBER_SKILL_DECORATORS } from '../../../tests/constants'
import install from '../../../tests/decorators/install'
import login from '../../../tests/decorators/login'
import seed from '../../../tests/decorators/seed'
import MercuryFixture from '../../../tests/fixtures/MercuryFixture'

MercuryFixture.setShouldRequireLocalListeners(false)

@login(DEMO_NUMBER_SKILL_DECORATORS)
@suite()
export default class UsingDecoratorsToInstallSkillsInstance extends AbstractSpruceFixtureTest {
    private skill!: SpruceSchemas.Spruce.v2020_07_22.Skill

    protected async beforeEach() {
        await super.beforeEach()

        this.skill = await this.skills.seedDemoSkill()
    }

    @test()
    protected throwsWhenMissingNamespaces() {
        assert.doesThrow(() => install.skills())
    }

    @test()
    protected returnsDecorator() {
        const decorator = this.getDecorator()
        assert.isFunction(decorator)
    }

    @test()
    @seed('organizations', 1)
    protected async callsOriginalTestMethod() {
        let wasHit = false
        await this.executeDecorator({
            testFunction: async () => {
                wasHit = true
            },
        })

        assert.isTrue(wasHit)
    }

    @test('passes args 1', [1])
    @test('passes args 1', ['hello', 'world'])
    @seed('organizations', 1)
    protected async passesThroughOriginalArgs(args: any) {
        let passedArgs: any

        debugger
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const me = this
        await this.executeDecorator({
            async testFunction(...args: any[]) {
                passedArgs = args
                //@ts-ignore
                assert.isEqual(this, me)
            },
            args,
        })

        assert.isEqualDeep(passedArgs, args)
    }

    @test()
    protected async throwsWithoutSeedingOrg() {
        await assert.doesThrowAsync(() =>
            this.executeDecorator({ testFunction: async () => {} })
        )
    }

    @test()
    @seed('organizations', 1)
    protected async throwsWhenInstallingBadSkill() {
        await assert.doesThrowAsync(() =>
            this.executeDecorator({
                testFunction: async () => {},
                namespaces: ['not-found'],
            })
        )
    }

    @test()
    @seed('organizations', 1)
    protected async doesNotEmitDidInstall() {
        let passedPayload: any

        await login
            .getClient()
            .on('install-skill::v2020_12_25', ({ payload }) => {
                passedPayload = payload
                return {}
            })

        await this.executeDecorator({
            testFunction: async () => {},
        })

        assert.isFalse(passedPayload.shouldNotifySkillOfInstall)
    }

    private async executeDecorator(options: {
        testFunction: () => Promise<any>
        args?: any[]
        namespaces?: string[]
    }) {
        const { testFunction, args, namespaces } = options

        const mockDescriptor = {
            value: testFunction,
        }

        const decorator = this.getDecorator(namespaces)
        decorator(
            UsingDecoratorsToInstallSkillsInstance,
            'myTest',
            mockDescriptor
        )

        //@ts-ignore
        await mockDescriptor.value(...(args ? args : []))
    }

    private getDecorator(namespaces?: string[]) {
        const slugs = namespaces ?? [this.skill.slug]
        return install.skills(...slugs)
    }
}
