import { test, assert } from '@sprucelabs/test-utils'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'

export default class AddsMercuryToTheSkillContextTest extends AbstractEventPluginTest {
    @test()
    protected static async addsMercuryToContext() {
        const { skill } = await this.bootSkillFromTestDir('skill')

        const context = skill.getContext()

        //@ts-ignore
        assert.isTruthy(context.client)
    }
}
