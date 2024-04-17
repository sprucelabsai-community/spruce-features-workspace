import { test } from '@sprucelabs/test-utils'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'

export default class BootingASkillWithoutEventsInstalledTest extends AbstractEventPluginTest {
    @test()
    protected static async canBootWithoutBeingInstalled() {
        const skill = await this.SkillFromTestDir('skill-events-not-installed')
        await skill.execute()
    }
}
