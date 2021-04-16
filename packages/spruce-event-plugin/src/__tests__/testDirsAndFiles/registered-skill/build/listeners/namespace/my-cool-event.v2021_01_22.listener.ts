import { SkillEventContract } from '@sprucelabs/mercury-types'
import {
	EventTarget,
	SpruceEvent,
	SpruceEventResponse,
} from '@sprucelabs/spruce-event-utils'
import Skill from '@sprucelabs/spruce-skill-booter'
import { assert } from '@sprucelabs/test'

export default async (
	event: SpruceEvent<
		SkillEventContract,
		{ payload: { foo: string; bar: string }; target: EventTarget }
	>
): SpruceEventResponse<{ taco: string }> => {
	assert.isTruthy(event)
	assert.isTrue(event.skill instanceof Skill)
	assert.isTruthy(event.log)
	assert.isTruthy(event.mercury)
	assert.isFunction(event.log.buildLog)

	const { payload, target, source } = event

	assert.isEqualDeep(payload, { foo: 'bar', bar: 'foo' })
	assert.isEqualDeep(target, { organizationId: '1234' })
	assert.isString(source.skillId)

	return {
		taco: 'bravo',
	}
}
