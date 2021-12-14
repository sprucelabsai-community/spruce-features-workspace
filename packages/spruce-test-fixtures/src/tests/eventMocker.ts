import { MercuryTestClient } from '@sprucelabs/mercury-client'
import { SkillEventContract } from '@sprucelabs/mercury-types'
import SpruceError from '../errors/SpruceError'

const eventMocker = {
	/** @ts-ignore */
	async makeEventThrow(fqen: keyof SkillEventContract['eventSignatures']) {
		const client = MercuryTestClient.getInternalEmitter({
			eventSignatures: {
				[fqen]: {},
			},
		})
		await client.on(fqen as any, () => {
			throw new SpruceError({
				code: 'MOCK_EVENT_ERROR',
				fqen,
			})
		})
	},
}

export default eventMocker
