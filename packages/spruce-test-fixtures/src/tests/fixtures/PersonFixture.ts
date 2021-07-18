import { formatPhoneNumber } from '@sprucelabs/schema'
import { SpruceSchemas } from '@sprucelabs/spruce-core-schemas'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import dotenv from 'dotenv'
import SpruceError from '../../errors/SpruceError'
import { ApiClientFactory } from '../../types/fixture.types'

dotenv.config()

type Person = SpruceSchemas.Spruce.v2020_07_22.Person
type Factory = ApiClientFactory
type ClientPromise = ReturnType<Factory>
type Client = ClientPromise extends PromiseLike<infer C> ? C : ClientPromise

export default class PersonFixture {
	private apiClientFactory: Factory

	public constructor(apiClientFactory: Factory) {
		this.apiClientFactory = apiClientFactory
	}

	public async loginAsDemoPerson(
		phone: string = process.env.DEMO_NUMBER ?? ''
	): Promise<{ person: Person; client: Client; token: string }> {
		if (!phone || phone.length === 0) {
			throw new SpruceError({
				code: 'MISSING_PARAMETERS',
				parameters: ['env.DEMO_NUMBER'],
			})
		}

		const formattedPhone = formatPhoneNumber(phone)
		const client = (await this.apiClientFactory()) as any

		//@ts-ignore
		if (client.auth?.person?.phone === formattedPhone) {
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

		const { challenge } =
			eventResponseUtil.getFirstResponseOrThrow(requestPinResults)

		const pin = phone.substr(-4)
		const confirmPinResults = await client.emit('confirm-pin::v2020_12_25', {
			payload: { challenge, pin },
		})

		const { person, token } =
			eventResponseUtil.getFirstResponseOrThrow(confirmPinResults)

		//@ts-ignore
		client.auth = { person }

		return { person, client, token }
	}

	public async destroy() {}
}
