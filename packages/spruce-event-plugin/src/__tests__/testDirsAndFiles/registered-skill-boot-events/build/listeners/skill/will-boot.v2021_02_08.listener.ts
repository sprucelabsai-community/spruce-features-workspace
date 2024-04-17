import {
    SpruceEvent,
    SpruceEventResponse,
} from '@sprucelabs/spruce-event-utils'
import { assert } from '@sprucelabs/test'

export default async (event: SpruceEvent): SpruceEventResponse => {
    //@ts-ignore
    assert.isFalsy(event.apiClient)

    const id = process.env.TO_COPY_SKILL_ID
    const apiKey = process.env.TO_COPY_SKILL_API_KEY

    if (id && apiKey) {
        process.env.SKILL_API_KEY = apiKey
        process.env.SKILL_ID = id
    }

    return
}
