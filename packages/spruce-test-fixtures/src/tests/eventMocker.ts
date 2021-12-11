import { EventNames, SkillEventContract } from '@sprucelabs/mercury-types'
import { MercuryFixture } from '..'
import SpruceError from '../errors/SpruceError'

const eventMocker = {
	async makeEventThrow(
		mercuryFixture: MercuryFixture,
		//@ts-ignore
		fqen: EventNames<SkillEventContract>
	) {
		const client = await mercuryFixture.connectToApi()
		await client.on(fqen as any, () => {
			throw new SpruceError({
				code: 'MOCK_EVENT_ERROR',
				fqen,
			})
		})
	},
}

export default eventMocker
