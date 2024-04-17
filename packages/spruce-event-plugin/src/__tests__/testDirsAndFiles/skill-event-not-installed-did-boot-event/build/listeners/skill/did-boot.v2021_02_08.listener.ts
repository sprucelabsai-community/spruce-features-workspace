import {
    SpruceEvent,
    SpruceEventResponse,
} from '@sprucelabs/spruce-event-utils'

export default async (e: SpruceEvent): SpruceEventResponse => {
    process.env.DID_BOOT = 'true'

    return
}
