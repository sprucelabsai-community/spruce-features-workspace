import { MercuryClientFactory, MercuryClient } from '@sprucelabs/mercury-client'
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

			const { client } = await Class.Fixture('view').loginAsDemoPerson(phone)

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
	if (!client) {
		assert.fail(
			`You must @login() on your test class before getting the client`
		)
	}

	return client as any
}
