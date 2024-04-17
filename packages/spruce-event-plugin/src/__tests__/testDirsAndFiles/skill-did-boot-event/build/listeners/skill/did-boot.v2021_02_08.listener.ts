import {
    SpruceEvent,
    SpruceEventResponse,
} from '@sprucelabs/spruce-event-utils'
import { assert } from '@sprucelabs/test'

export default async (e: SpruceEvent): SpruceEventResponse => {
    process.env.DID_BOOT_EARLY = 'true'

    assert.isTrue(e.skill.isBooted())

    await new Promise((resolve) => setTimeout(resolve, 1000))

    process.env.DID_BOOT_LATE = 'true'

    return
}
