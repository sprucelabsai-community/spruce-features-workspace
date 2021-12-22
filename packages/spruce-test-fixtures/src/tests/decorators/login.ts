import { MercuryClientFactory, MercuryClient } from '@sprucelabs/mercury-client'
import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { assert } from '@sprucelabs/test'
import { ClientProxyDecorator, MercuryFixture, ViewFixture } from '../..'

type Client = MercuryClient

export default function login(phone: string) {
	return function (Class: any) {
		let proxyToken: string | undefined
		ClientProxyDecorator.getInstance().setProxyTokenGenerator(async () => {
			if (!proxyToken) {
				const client = login.getClient()

				const results = await client.emit('register-proxy-token::v2020_12_25')
				const { token } = eventResponseUtil.getFirstResponseOrThrow(results)

				proxyToken = token
			}

			return proxyToken
		})

		assert.isFunction(
			Class.Fixture,
			`You can only @login if your test extends AbstractSpruceFixtureTest`
		)

		MercuryFixture.setShouldAutomaticallyClearDefaultClient(false)
		ViewFixture.setShouldAutomaticallyResetAuthenticator(false)

		const beforeAll = Class.beforeAll.bind(Class)

		Class.beforeAll = async () => {
			MercuryClientFactory.setIsTestMode(true)

			await beforeAll()

			const { client, person } = await Class.Fixture('view').loginAsDemoPerson(
				phone
			)

			//@ts-ignore
			login.loggedInPerson = person
			MercuryFixture.setDefaultClient(client)
		}

		const beforeEach = Class.beforeEach.bind(Class)

		Class.beforeEach = async () => {
			MercuryFixture.setDefaultContractToLocalEventsIfExist(Class.cwd)
			await beforeEach?.()
		}

		const afterAll = Class.afterAll.bind(Class)

		Class.afterAll = async () => {
			const client = MercuryFixture.getDefaultClient()
			await client?.disconnect()

			MercuryFixture.clearDefaultClient()
			await afterAll()
		}
	}
}

login.getClient = (): Client => {
	const client = MercuryFixture.getDefaultClient()
	assert.isTruthy(
		client,
		`You must @login() on your test class before getting the client!`
	)

	return client as any
}

login.getPerson = (): SpruceSchemas.Spruce.v2020_07_22.Person => {
	assert.isTruthy(
		//@ts-ignore
		login.loggedInPerson,
		`You must @login() on your test class before getting the person`
	)

	//@ts-ignore
	return login.loggedInPerson
}
