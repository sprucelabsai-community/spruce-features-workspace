import { LoggableType, buildLog } from '@sprucelabs/spruce-skill-utils'
import { assert, test } from '@sprucelabs/test-utils'
import AbstractSkillTest from '../../tests/AbstractSkillTest'

export default class BootingASkillTest extends AbstractSkillTest {
    @test()
    protected static async bootLoadsPluginsFromBuildDir() {
        await assert.doesThrowAsync(
            () => this.bootSkillFromTestDir('skill'),
            'LOADED CORRECTLY'
        )
    }

    @test()
    protected static async canSetCwd() {
        this.cwd = 'aoeuaoeu'
    }

    @test()
    protected static async resetsCwd() {
        assert.isEqual(this.cwd, process.cwd())
    }

    @test()
    protected static async bootShouldNotStartCountdownUntilAfterExecute() {
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

        await this.bootSkill({ skill, shouldWaitForPostBoot: false })

        let logged = messages.join(' ')
        assert.isFalse(logged.includes('Shutting down'))

        await this.wait(1000)

        logged = messages.join(' ')
        assert.isTrue(logged.includes('Shutting down'))
    }
}
