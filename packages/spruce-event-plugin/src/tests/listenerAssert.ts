import { SkillEventContract } from '@sprucelabs/mercury-types'
import { eventNameUtil } from '@sprucelabs/spruce-event-utils'
import { Skill } from '@sprucelabs/spruce-skill-utils'
import { assert } from '@sprucelabs/test-utils'
import { SpyEventFeaturePlugin } from '../__tests__/behavioral/listeners/AssertingGlobalListeners.test'

const listenerAssert = {
	skillRegistersGlobalListener(
		skill: Skill,
		fqen: keyof SkillEventContract['eventSignatures']
	) {
		const events = skill.getFeatureByCode('event') as SpyEventFeaturePlugin

		const listener = events.listeners.find(
			(e) => eventNameUtil.join(e) === fqen
		)

		assert.isTruthy(
			listener,
			`I could not find any listener for '${fqen}'! Try 'spruce create.listener' to get one started!`
		)

		assert.isTrue(
			listener.isGlobal,
			`Oh no! I found a listener for '${fqen}', but it's not global. Try adding 'export const isGlobal = true' to you listener file!`
		)
	},
}

export default listenerAssert
