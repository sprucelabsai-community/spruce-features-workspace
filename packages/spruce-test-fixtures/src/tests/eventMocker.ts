import { MercuryTestClient } from '@sprucelabs/mercury-client'
import { SkillEventContract } from '@sprucelabs/mercury-types'
import SpruceError from '../errors/SpruceError'

/** @ts-ignore */
type Fqen = keyof SkillEventContract['eventSignatures']

const eventMocker = {
	async makeEventThrow(fqen: Fqen) {
		const client = getClient(fqen)

		await client.off(fqen)
		await client.on(fqen as any, () => {
			throw new SpruceError({
				code: 'MOCK_EVENT_ERROR',
				fqen,
			})
		})
	},

	async handleReactiveEvent(fqen: Fqen) {
		const client = getClient(fqen)
		await client.on(fqen, () => {})
	},
}

export default eventMocker
function getClient(fqen: string) {
	return MercuryTestClient.getInternalEmitter({
		eventSignatures: {
			[fqen]: {},
		},
	})
}
