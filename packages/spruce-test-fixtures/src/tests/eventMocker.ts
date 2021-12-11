import {
	EventContract,
	EventNames,
	SkillEventContract,
} from '@sprucelabs/mercury-types'
import { MercuryFixture } from '..'
import SpruceError from '../errors/SpruceError'

const eventMocker = {
	/** @ts-ignore */
	async makeEventThrow<Contract extends EventContract = SkillEventContract>(
		mercuryFixture: MercuryFixture,
		fqen: EventNames<Contract>
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
