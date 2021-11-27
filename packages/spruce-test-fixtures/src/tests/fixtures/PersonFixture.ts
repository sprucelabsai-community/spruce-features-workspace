import { formatPhoneNumber, SchemaError } from '@sprucelabs/schema'
import { SpruceSchemas } from '@sprucelabs/spruce-core-schemas'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import dotenv from 'dotenv'
import { TestConnectFactory } from '../../types/fixture.types'

dotenv.config()

type Person = SpruceSchemas.Spruce.v2020_07_22.Person
type Factory = TestConnectFactory
type ClientPromise = ReturnType<Factory>
type Client = ClientPromise extends PromiseLike<infer C> ? C : ClientPromise

export default class PersonFixture {
	private connectToApi: Factory
	private lastLoggedIn?: {
		person: Person
		client: Client
		token: string
	}

	public constructor(options: { connectToApi: Factory }) {
		this.connectToApi = options.connectToApi
	}

	public async loginAsDemoPerson(
		phone?: string
	): Promise<{ person: Person; client: Client; token: string }> {
		if (
			this.lastLoggedIn &&
			(!phone || phone === this.lastLoggedIn.person.phone)
		) {
			return this.lastLoggedIn
		}

		const client = (await this.connectToApi({
			shouldReUseClient: !phone,
		})) as any

		if (client.auth?.person) {
			return {
				client,
				person: client.auth.person,
				token: client.auth.token,
			}
		}

		let p = phone ?? process.env.DEMO_NUMBER

		if (!p || p.length === 0) {
			throw new SchemaError({
				code: 'MISSING_PARAMETERS',
				parameters: ['env.DEMO_NUMBER'],
				friendlyMessage: `I don't know who to login as. You can set env.DEMO_NUMBER, use the '@login()' decorator, or use 'MercuryFixture.setDefaultClient()' directly. See http://developer.spruce.ai/#/views/index?id=authentication`,
			})
		}

		const formattedPhone = formatPhoneNumber(p)

		//@ts-ignore
		if (client.auth?.person?.phone === formattedPhone) {
			return {
				client,
				person: client.auth.person,
				token: client.auth.token,
			}
		}

		const requestPinResults = await client.emit('request-pin::v2020_12_25', {
			payload: { phone: p },
		})

		const { challenge } =
			eventResponseUtil.getFirstResponseOrThrow(requestPinResults)

		const pin = p.substr(-4)
		const confirmPinResults = await client.emit('confirm-pin::v2020_12_25', {
			payload: { challenge, pin },
		})

		const { person, token } =
			eventResponseUtil.getFirstResponseOrThrow(confirmPinResults)

		//@ts-ignore
		client.auth = { person, token }

		this.lastLoggedIn = { person, client, token }

		return this.lastLoggedIn
	}

	public async destroy() {}
}
