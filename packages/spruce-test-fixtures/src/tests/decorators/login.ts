import { MercuryClientFactory, MercuryClient } from '@sprucelabs/mercury-client'
import { assert } from '@sprucelabs/test'
import { MercuryFixture, ViewFixture } from '../..'

type Client = MercuryClient

export default function login(phone: string) {
	return function (constructor: any) {
		assert.isFunction(
			constructor.Fixture,
			`You can only @login if your test extends AbstractSpruceFixtureTest`
		)

		MercuryFixture.setShouldAutomaticallyClearDefaultClient(false)
		ViewFixture.setShouldAutomaticallyResetAuthenticator(false)

		const beforeAll = constructor.beforeAll.bind(constructor)

		constructor.beforeAll = async () => {
			MercuryClientFactory.setIsTestMode(true)

			await beforeAll()

			const { client } = await constructor
				.Fixture('view')
				.loginAsDemoPerson(phone)

			MercuryFixture.setDefaultClient(client)
		}

		const afterAll = constructor.afterAll.bind(constructor)

		constructor.afterAll = async () => {
			const client = MercuryFixture.getDefaultClient()
			await client?.disconnect()

			MercuryFixture.clearDefaultClient()
			await afterAll()
		}
	}
}

login.getClient = (): Client => {
	const client = MercuryFixture.getDefaultClient()
	if (!client) {
		assert.fail(
			`You must @login() on your test class before getting the client`
		)
	}

	return client as any
}
