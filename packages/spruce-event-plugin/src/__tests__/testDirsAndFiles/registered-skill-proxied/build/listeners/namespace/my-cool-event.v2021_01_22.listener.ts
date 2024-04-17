import { SkillEventContract } from '@sprucelabs/mercury-types'
import {
    EventTarget,
    SpruceEvent,
    SpruceEventResponse,
} from '@sprucelabs/spruce-event-utils'
import { assert } from '@sprucelabs/test'

export default async (
    event: SpruceEvent<SkillEventContract, { target: EventTarget; source: any }>
): SpruceEventResponse<{}> => {
    //@ts-ignore
    await event.client
        .emit('test-proxied-event::v1')

        [('on', 'emit', 'disconnect')].forEach((k) => {
            //@ts-ignore
            assert.isFunction(event.client[k], `${k}() is not being delegated.`)
        })

    return {}
}
