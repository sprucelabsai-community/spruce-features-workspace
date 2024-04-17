import { SkillEventContract } from '@sprucelabs/mercury-types'
import {
    SpruceEvent,
    SpruceEventResponse,
} from '@sprucelabs/spruce-event-utils'
import { assert } from '@sprucelabs/test'
import { EventFeature } from '../../../../../..'

export default async (
    event: SpruceEvent<
        SkillEventContract,
        { payload: { foo: string; bar: string } }
    >
): SpruceEventResponse<{ taco: string }> => {
    const client = await event.connectToApiAsSkill()
    const events = event.skill.getFeatureByCode('event') as EventFeature
    const otherClient = await events.connectToApi()

    assert.isEqual(client, otherClient)

    return {
        //@ts-ignore
        taco: 'all good',
    }
}
