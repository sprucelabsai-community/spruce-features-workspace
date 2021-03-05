import { EventContract } from '@sprucelabs/mercury-types'
import {
	SpruceEvent,
	SpruceEventResponse,
} from '@sprucelabs/spruce-event-utils'
import { assert } from '@sprucelabs/test'

export default async (
	event: SpruceEvent<EventContract, { payload: { foo: string; bar: string } }>
): SpruceEventResponse<{ taco: string }> => {
	assert.isTruthy(event.mercury)
	assert.isTruthy(event.helloWorld)

	return {
		taco: event.helloWorld,
	}
}
