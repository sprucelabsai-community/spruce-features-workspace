import {
    SpruceEvent,
    SpruceEventResponse,
} from '@sprucelabs/spruce-event-utils'
import { assert } from '@sprucelabs/test'

export default async (event: SpruceEvent): SpruceEventResponse => {
    //@ts-ignore
    assert.isTruthy(event.client)

    process.env.REGISTER_SKILL_API_KEY_BOOT_EVENTS = process.env.SKILL_API_KEY

    return
}
