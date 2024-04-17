import { SkillEventContract } from '@sprucelabs/mercury-types'
import {
    EventTarget,
    SpruceEvent,
    SpruceEventResponse,
} from '@sprucelabs/spruce-event-utils'
import Skill from '@sprucelabs/spruce-skill-booter'
import { assert } from '@sprucelabs/test'

export default async (
    event: SpruceEvent<
        SkillEventContract,
        {
            payload: { foo: string; bar: string; orgId: string }
            target: EventTarget
        }
    >
): SpruceEventResponse<{ taco: string }> => {
    assert.isTruthy(event)
    assert.isTrue(event.skill instanceof Skill)
    assert.isTruthy(event.log)
    assert.isTruthy(event.client)
    assert.isFunction(event.log.buildLog)

    const { payload, target, source } = event

    assert.isEqual(payload.foo, 'bar')
    assert.isEqual(payload.bar, 'foo')
    assert.isEqualDeep(target, { organizationId: payload.orgId })
    assert.isString(source.skillId)

    return {
        taco: 'bravo',
    }
}
