import {
	SpruceEvent,
	SpruceEventResponse,
} from '@sprucelabs/spruce-event-utils'
import { assert } from '@sprucelabs/test'

export default async (event: SpruceEvent): SpruceEventResponse => {
	//@ts-ignore
	assert.isTruthy(event.mercury)
	return
}
