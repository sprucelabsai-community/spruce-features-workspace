import { SkillEventContract } from '@sprucelabs/mercury-types'
import {
	SpruceEvent,
	SpruceEventResponse,
} from '@sprucelabs/spruce-event-utils'
import { assert } from '@sprucelabs/test'

declare module '@sprucelabs/spruce-skill-utils/build/types/skill.types' {
	interface SkillContext {
		helloWorld: string
	}
}

export default async (
	event: SpruceEvent<
		SkillEventContract,
		{ payload: { foo: string; bar: string } }
	>
): SpruceEventResponse<{ taco: string }> => {
	assert.isTruthy(event.mercury)
	assert.isTruthy(event.helloWorld)

	return {
		taco: event.helloWorld,
	}
}
