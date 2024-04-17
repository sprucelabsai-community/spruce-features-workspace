import { test, assert } from '@sprucelabs/test-utils'
import { EventFeaturePlugin } from '../../plugins/event.plugin'
import AbstractEventPluginTest from '../../tests/AbstractEventPluginTest'

export default class KillingTheSkillTest extends AbstractEventPluginTest {
    @test()
    protected static async killingSkillDisconnectsClient() {
        const skill = await this.Skill()

        void skill.execute()

        const plugin = skill.getFeatureByCode('event') as EventFeaturePlugin

        const client = await plugin.connectToApi()

        assert.isTruthy(client)

        assert.isTrue(client.isConnected())

        await skill.kill()

        assert.isFalse(client.isConnected())
    }

    @test()
    protected static async bootEventCrashingSkillCausesConnectToApiToThrow() {
        this.cwd = this.resolveTestPath('skill-will-boot-throws')
        const skill = await this.Skill()

        await skill.execute().catch((err: any) => {
            assert.isEqual(err.message, 'what the!')
        })

        const plugin = skill.getFeatureByCode('event') as EventFeaturePlugin
        await assert.doesThrowAsync(() => plugin.connectToApi())
    }
}
