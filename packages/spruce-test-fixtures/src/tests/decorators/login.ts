import { MercuryClientFactory, MercuryClient } from '@sprucelabs/mercury-client'
import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { assert } from '@sprucelabs/test-utils'
import { MercuryFixture, ViewFixture } from '../..'

type Client = MercuryClient

export default function login(phone: string) {
	return function (Class: any) {
		assert.isFunction(
			Class.Fixture,
			`You can only @login if your test extends AbstractSpruceFixtureTest`
		)

		MercuryFixture.setShouldAutomaticallyClearDefaultClient(false)
		ViewFixture.setShouldAutomaticallyResetAuth(false)

		const beforeAll = Class.beforeAll.bind(Class)
		let proxyGenerator: any

		Class.beforeAll = async () => {
			MercuryClientFactory.setIsTestMode(true)

			await beforeAll()

			const viewFixture = Class.Fixture('view')
			const { client, person } = await viewFixture.loginAsDemoPerson(phone)

			proxyGenerator = viewFixture.getProxyTokenGenerator()

			//@ts-ignore
			login.loggedInPerson = person

			MercuryFixture.setDefaultClient(client)
			ViewFixture.lockProxyCacheForPerson(person.id)

			await emitDidLogin(client)
		}

		const beforeEach = Class.beforeEach.bind(Class)

		Class.beforeEach = async () => {
			Class.Fixture('view').setProxyTokenGenerator(proxyGenerator)
			MercuryFixture.setDefaultContractToLocalEventsIfExist(Class.cwd)
			await beforeEach?.()
		}

		const afterAll = Class.afterAll.bind(Class)

		Class.afterAll = async () => {
			const client = MercuryFixture.getDefaultClient()
			await emitWillLogout(client)

			MercuryFixture.clearDefaultClient()
			await afterAll()

			await client?.disconnect()
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

login.on = async (
	name: 'did-login' | 'will-logout',
	cb: (options: {
		client: Client
		person: SpruceSchemas.Spruce.v2020_07_22.Person
	}) => Promise<void> | void
) => {
	//@ts-ignore
	if (!login.listeners) {
		//@ts-ignore
		login.listeners = {}
	}

	//@ts-ignore
	login.listeners[name] = cb
}

async function emitDidLogin(client: any) {
	//@ts-ignore
	let didLogin = login?.listeners?.['did-login']

	if (didLogin) {
		await didLogin(client)
	}
}

async function emitWillLogout(client: any) {
	//@ts-ignore
	let willLogout = login?.listeners?.['will-logout']

	if (willLogout) {
		await willLogout(client)
	}
}
