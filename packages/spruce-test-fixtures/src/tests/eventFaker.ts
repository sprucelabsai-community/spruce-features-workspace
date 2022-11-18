import { MercuryTestClient } from '@sprucelabs/mercury-client'
import {
	EventNames,
	EventSignature,
	SkillEventContract,
} from '@sprucelabs/mercury-types'
import { SchemaValues, Schema } from '@sprucelabs/schema'
import SpruceError from '../errors/SpruceError'

type Fqen = EventNames

type EmitPayloadSchema<E extends Fqen> =
	SkillEventContract['eventSignatures'][E]['emitPayloadSchema']

type ResponsePayloadSchema<E extends Fqen> =
	SkillEventContract['eventSignatures'][E] extends EventSignature
		? SkillEventContract['eventSignatures'][E]['responsePayloadSchema']
		: never

type TargetAndPayload<
	E extends Fqen,
	S extends Schema | never = EmitPayloadSchema<E> extends Schema
		? EmitPayloadSchema<E>
		: never
> = SchemaValues<S>

type Response<E extends Fqen> = ResponsePayloadSchema<E> extends Schema
	? SchemaValues<ResponsePayloadSchema<E>>
	: void

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

	async on<E extends Fqen>(
		fqen: E,
		cb: (
			targetAndPayload: TargetAndPayload<E>
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
