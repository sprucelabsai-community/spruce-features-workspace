import { EventContract } from '@sprucelabs/mercury-types'
import {
	SpruceEvent,
	SpruceEventResponse,
} from '@sprucelabs/spruce-event-utils'
import Skill from '@sprucelabs/spruce-skill-booter'
import { assert } from '@sprucelabs/test'

export default async (
	event: SpruceEvent<EventContract, { payload: { foo: string; bar: string } }>
): SpruceEventResponse<{ taco: string }> => {
	assert.isTruthy(event)
	assert.isTrue(event.skill instanceof Skill)
	assert.isTruthy(event.log)
	assert.isFunction(event.log.buildLog)

	const { targetAndPayload } = event

	assert.isEqualDeep(targetAndPayload.payload, { foo: 'bar', bar: 'foo' })

	return {
		taco: 'bravo',
	}
}
