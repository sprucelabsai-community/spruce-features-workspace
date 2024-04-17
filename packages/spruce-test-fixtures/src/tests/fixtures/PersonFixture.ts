import { MercuryClient } from '@sprucelabs/mercury-client'
import { formatPhoneNumber, SchemaError } from '@sprucelabs/schema'
import { SpruceSchemas } from '@sprucelabs/spruce-core-schemas'
import dotenv from 'dotenv'
import { TestConnectFactory } from '../../types/fixture.types'
import generateRandomName from './generateRandomName'

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

    public async listPeople(options: {
        organizationId: string
        locationId?: string
        personIds?: string[]
        roleBases?: string[]
        roleIds?: string[]
        shouldIncludePrivateFields?: boolean
    }) {
        const { organizationId, locationId, ...rest } = options

        const { client } = await this.loginAsDemoPerson()
        const [{ people }] = await client.emitAndFlattenResponses(
            'list-people::v2020_12_25',
            {
                target: {
                    organizationId,
                    locationId,
                },
                payload: {
                    ...rest,
                },
            }
        )

        return people
    }

    public async generateRandomName(client: MercuryClient) {
        const values = generateRandomName()

        const [{ person }] = await client.emitAndFlattenResponses(
            'update-person::v2020_12_25',
            {
                payload: values,
            }
        )

        return { ...person, ...values }
    }

    public async loginAsDemoPerson(
        phone?: string
    ): Promise<{ person: Person; client: Client; token: string }> {
        if (
            this.lastLoggedIn &&
            (!phone ||
                formatPhoneNumber(phone) === this.lastLoggedIn.person.phone)
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

        const [{ challenge }] = await client.emitAndFlattenResponses(
            'request-pin::v2020_12_25',
            {
                payload: { phone: p },
            }
        )

        const pin = p.substr(-4)
        const [{ person, token }] = await client.emitAndFlattenResponses(
            'confirm-pin::v2020_12_25',
            {
                payload: { challenge, pin },
            }
        )

        //@ts-ignore
        client.auth = { person, token }

        this.lastLoggedIn = { person, client, token }

        return this.lastLoggedIn
    }

    public async destroy() {}
}
