import { MercuryClient } from '@sprucelabs/mercury-client'
import { SkillEventContract } from '@sprucelabs/mercury-types'
import {
	EventTarget,
	SpruceEvent,
	SpruceEventResponse,
} from '@sprucelabs/spruce-event-utils'
import { assert } from '@sprucelabs/test'

export default async (
	event: SpruceEvent<
		SkillEventContract,
		{ payload: { foo: string; bar: string, orgId: string }; target: EventTarget }
	>
): SpruceEventResponse<{ taco: string }> => {
	
	debugger
	assert.isTruthy((event.client as MercuryClient).getProxyToken(), 'Missing proxy token')

	return {
		taco: 'bravo',
	}
}
