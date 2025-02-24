import {
    LoggableType,
    PkgService,
    buildLog,
} from '@sprucelabs/spruce-skill-utils'
import { assert, generateId, suite, test } from '@sprucelabs/test-utils'
import AbstractSkillTest from '../../../tests/AbstractSkillTest'

@suite()
export default class BootingASkillInstanceTest extends AbstractSkillTest {
    @test()
    protected async bootLoadsPluginsFromBuildDir() {
        await assert.doesThrowAsync(
            () => this.bootSkillFromTestDir('skill'),
            'LOADED CORRECTLY'
        )
    }

    @test()
    protected async canSetCwd() {
        this.cwd = 'aoeuaoeu'
    }

    @test()
    protected async resetsCwd() {
        assert.isEqual(this.cwd, process.cwd())
    }

    @test()
    protected async bootShouldNotStartCountdownUntilAfterExecute() {
        this.cwd = process.cwd()

        const messages: LoggableType[] = []

        const logger = buildLog()
        logger.info = (...m: LoggableType[]) => {
            messages.push(...m)
            return m.join(' ')
        }

        const skill = await this.Skill({
            shouldCountdownOnExit: true,
            log: logger,
        })

        skill.registerFeature('test', {
            _isBooted: false,
            _bootHandler() {},
            onBoot(handler) {
                //@ts-ignore
                this._bootHandler = handler
            },
            async execute() {
                //@ts-ignore
                this._isBooted = true

                //@ts-ignore
                this._bootHandler()

                await new Promise((r) => setTimeout(r, 1000))
            },
            //@ts-ignore
            async checkHealth() {},
            async isInstalled() {
                return true
            },
            async destroy() {},
            isBooted() {
                //@ts-ignore
                return this._isBooted
            },
        })

        await this.bootSkill({ skill, shouldWaitForDidBoot: false })

        let logged = messages.join(' ')
        assert.isFalse(logged.includes('Shutting down'))

        await this.wait(1000)

        logged = messages.join(' ')
        assert.isTrue(logged.includes('Shutting down'))
    }

    @test()
    protected async setsProcessTitleToMatchSkillNamespace() {
        const skill = await this.SkillFromTestDir('skill-with-pkg-json')

        const pkg = new PkgService(this.cwd)
        const namespace = generateId()

        pkg.set({
            path: ['skill', 'namespace'],
            value: namespace,
        })

        await this.bootSkill({ skill })

        assert.isEqual(process.title, `${namespace} skill (node)`)
    }
}
