import { SkillEventContract } from '@sprucelabs/mercury-types'
import { MercuryFixture } from '..'
import SpruceError from '../errors/SpruceError'

const eventMocker = {
	async makeEventThrow(
		mercuryFixture: MercuryFixture,
		fqen: keyof SkillEventContract['eventSignatures']
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
