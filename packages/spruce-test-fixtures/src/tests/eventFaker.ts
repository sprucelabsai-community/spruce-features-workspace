import { MercuryTestClient } from '@sprucelabs/mercury-client'
import { SkillEventContract } from '@sprucelabs/mercury-types'
import { SchemaValues } from '@sprucelabs/schema'
import SpruceError from '../errors/SpruceError'

/** @ts-ignore */
type Fqen = keyof SkillEventContract['eventSignatures']

type TargetAndPayload<E extends Fqen> = SchemaValues<
	/** @ts-ignore */
	SkillEventContract['eventSignatures'][E]['emitPayloadSchema']
>

type Response<E extends Fqen> = SchemaValues<
	/** @ts-ignore> */
	SkillEventContract['eventSignatures'][E]['responsePayloadSchema']
>

const eventFaker = {
	async makeEventThrow(fqen: Fqen, error?: any) {
		const client = getClient(fqen)

		await client.off(fqen)

		await client.on(fqen as any, () => {
			throw (
				error ??
				new SpruceError({
					code: 'FAKE_EVENT_ERROR',
					fqen,
				})
			)
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
		const client = getClient(fqen)

		await client.off(fqen)
		await client.on(fqen, cb as any)
	},
}

export default eventFaker
function getClient(fqen: string) {
	return MercuryTestClient.getInternalEmitter({
		eventSignatures: {
			[fqen]: {},
		},
	})
}
