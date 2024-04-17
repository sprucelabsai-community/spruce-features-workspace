import {
    SpruceEvent,
    SpruceEventResponse,
} from '@sprucelabs/spruce-event-utils'
import Skill from '@sprucelabs/spruce-skill-booter'
import { assert } from '@sprucelabs/test'

export default async (event: SpruceEvent): SpruceEventResponse => {
    assert.isTruthy(event)
    assert.isTrue(event.skill instanceof Skill)
    assert.isTruthy(event.log)
    assert.isFunction(event.log.buildLog)

    process.env.DID_BOOT_FIRED = 'true'

    return
}
