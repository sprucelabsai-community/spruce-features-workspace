import { EventNames, SkillEventContract } from '@sprucelabs/mercury-types'
import { MercuryFixture } from '..'
import SpruceError from '../errors/SpruceError'

export const eventMocker = {
	async makeEventThrow(
		mercuryFixture: MercuryFixture,
		//@ts-ignore
		eventName: EventNames<SkillEventContract>
	) {
		const client = await mercuryFixture.connectToApi()
		await client.on(eventName as any, () => {
			throw new SpruceError({
				code: 'MOCK_EVENT_ERROR',
				eventName,
			})
		})
	},
}
