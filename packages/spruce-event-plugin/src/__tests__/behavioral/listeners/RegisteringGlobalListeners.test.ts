import { eventNameUtil } from '@sprucelabs/spruce-event-utils'
import { fake } from '@sprucelabs/spruce-test-fixtures'
import { assert, test } from '@sprucelabs/test-utils'
import { EventFeaturePlugin } from '../../../plugins/event.plugin'
import { RegisterListerTargetAndPayload } from '../../support/EventFaker'
import AbstractListenerTest from './AbstractListenersTest'

@fake.login()
export default class RegisteringGlobalEventsTest extends AbstractListenerTest {
    private static passedPayload?: RegisterListerTargetAndPayload['payload']

    protected static async beforeEach() {
        await super.beforeEach()
        this.passedPayload = undefined

        await this.eventFaker.fakeRegisterListeners(({ payload }) => {
            this.passedPayload = payload
            return {}
        })
    }

    @test()
    protected static async registersGloballyIfSet() {
        await this.bootSkillNamed('registered-skill-global-listener')
        this.assertFirstListenerGlobal(true)
    }

    @test()
    protected static async notGlobalIfNotGlobalSet() {
        await this.bootSkillNamed('registered-skill')
        this.assertFirstListenerGlobal(false)
    }

    @test()
    protected static async shouldNotEmitIfListenersAreCached() {
        await this.setCwdToTestSkill('registered-skill')
        await this.registerSkillAndSetupListeners()
        const feature = this.skill.getFeatureByCode(
            'event'
        ) as EventFeaturePlugin
        //@ts-ignore
        feature.areListenersCached = () => true
        await this.bootSkill({ skill: this.skill })
        assert.isFalsy(this.passedPayload)
    }

    private static assertFirstListenerGlobal(expected: boolean) {
        assert.isEqualDeep(this.passedPayload, {
            events: [
                {
                    eventName: eventNameUtil.join({
                        eventName: 'my-cool-event',
                        eventNamespace: this.registeredSkill.slug,
                        version: 'v2021_01_22',
                    }),
                    isGlobal: expected,
                },
            ],
        })
    }
}
