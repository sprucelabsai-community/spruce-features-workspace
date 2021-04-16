import {
	SpruceEvent,
	SpruceEventResponse,
} from '@sprucelabs/spruce-event-utils'
import { assert } from '@sprucelabs/test'

export default async (e: SpruceEvent): SpruceEventResponse => {
	assert.isTrue(e.skill.isBooted())
	return
}
