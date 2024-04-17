import { SkillEventContract } from '@sprucelabs/mercury-types'
import {
    SpruceEvent,
    SpruceEventResponse,
} from '@sprucelabs/spruce-event-utils'
import { assert } from '@sprucelabs/test'

export default async (
    event: SpruceEvent<
        SkillEventContract,
        { payload: { foo: string; bar: string } }
    >
): SpruceEventResponse<{ taco: string }> => {
    assert.isTruthy(event.client)
    //@ts-ignore
    assert.isTruthy(event.helloWorld)

    return {
        //@ts-ignore
        taco: event.helloWorld,
    }
}
