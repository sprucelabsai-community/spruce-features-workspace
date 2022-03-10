import { MercuryTestClient } from '@sprucelabs/mercury-client'
import { SkillEventContract } from '@sprucelabs/mercury-types'
import { SchemaValues } from '@sprucelabs/schema'
import SpruceError from '../errors/SpruceError'

/** @ts-ignore */
type Fqen = keyof SkillEventContract['eventSignatures']

type TargetAndPayload<E extends Fqen> = SchemaValues<
	SkillEventContract['eventSignatures'][E]['emitPayloadSchema']
>

type Response<E extends Fqen> = SchemaValues<
	/** @ts-ignore> */
	SkillEventContract['eventSignatures'][E]['responsePayloadSchema']
>

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

	/** @ts-ignore */
	async on<E extends Fqen>(
		fqen: E,
		cb: (
			/** @ts-ignore */
			targetAndPayload: TargetAndPayload<E>
			/** @ts-ignore */
		) => Response<E> | Promise<Response<E>>
	) {
		const client = getClient('1234')

		await client.off(fqen)
		await client.on(fqen, cb as any)
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
