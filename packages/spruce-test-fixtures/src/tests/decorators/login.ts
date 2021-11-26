import { assert } from '@sprucelabs/test'
import { MercuryFixture } from '../..'

export default function login(phone: string) {
	return function (constructor: any) {
		assert.isFunction(
			constructor.Fixture,
			`You can only @login if your test extends AbstractSpruceFixtureTest`
		)

		MercuryFixture.setShouldAutomaticallyClearDefaultClient(false)

		const beforeAll = constructor.beforeAll.bind(constructor)

		constructor.beforeAll = async () => {
			await beforeAll()

			const { client } = await constructor
				.Fixture('person')
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
