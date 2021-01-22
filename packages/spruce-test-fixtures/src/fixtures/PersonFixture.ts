import { SpruceSchemas } from '@sprucelabs/spruce-core-schemas'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import dotenv from 'dotenv'
import SpruceError from '../errors/SpruceError'
import { ApiClientFactory } from '../types/fixture.types'

dotenv.config()

type Person = SpruceSchemas.Spruce.v2020_07_22.Person

export default class PersonFixture<
	Factory extends ApiClientFactory = ApiClientFactory,
	ClientPromise extends ReturnType<Factory> = ReturnType<Factory>,
	Client = ClientPromise extends PromiseLike<infer C> ? C : ClientPromise
> {
	private apiClientFactory: Factory
	private static clients: any[] = []

	public constructor(apiClientFactory: Factory) {
		this.apiClientFactory = apiClientFactory
	}

	public async loginAsDemoPerson(
		phone: string = process.env.DEMO_NUMBER ?? ''
	): Promise<{ person: Person; client: Client }> {
		if (!phone || phone.length === 0) {
			throw new SpruceError({
				code: 'MISSING_PARAMETERS',
				parameters: ['env.DEMO_NUMBER'],
			})
		}

		const client = (await this.apiClientFactory()) as any

		//@ts-ignore
		if (client.auth?.person?.phone === phone) {
			return {
				//@ts-ignore
				client,
				//@ts-ignore
				person: client.auth.person,
			}
		}

		const requestPinResults = await client.emit('request-pin::v2020_12_25', {
			payload: { phone },
		})

		const { challenge } = eventResponseUtil.getFirstResponseOrThrow(
			requestPinResults
		)

		const confirmPinResults = await client.emit('confirm-pin::v2020_12_25', {
			payload: { challenge, pin: phone.substr(-4) },
		})

		const { person } = eventResponseUtil.getFirstResponseOrThrow(
			confirmPinResults
		)

		//@ts-ignore
		client.auth = { person }

		PersonFixture.clients.push(client)

		return { person, client }
	}

	public async destroy() {
		for (const client of PersonFixture.clients) {
			await client.disconnect()
		}
		PersonFixture.clients = []
	}
}
