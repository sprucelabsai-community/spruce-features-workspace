import { MercuryClient } from '@sprucelabs/mercury-client'
import { assert, test } from '@sprucelabs/test'
import { fake } from '../..'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'

@fake.login()
export default class WhoAmITest extends AbstractSpruceFixtureTest {
	@test()
	protected static async canRegisterProxyToken() {
		const proxy = await this.registerOwnerProxy()
		assert.isTruthy(proxy)
		const proxy2 = await this.registerOwnerProxy()
		assert.isNotEqual(proxy, proxy2)
	}

	@test()
	protected static async canUseProxyToEmitAsOtherPerson() {
		const { client } = await this.loginAsOutsider()

		const proxy = await this.registerOwnerProxy()
		client.setProxyToken(proxy)

		const auth = await this.emitWhoAmI(client)
		assert.isEqualDeep(auth.person, this.fakedOwner)
	}

	@test()
	protected static async canUseProxyAsSecondPerson() {
		const { client, person } = await this.loginAsOutsider()
		const proxy = await client.registerProxyToken()
		this.client.setProxyToken(proxy)

		const auth = await this.emitWhoAmI()
		assert.isEqualDeep(auth.person, person)
	}

	private static async loginAsOutsider() {
		const { client, person } = await this.people.loginAsDemoPerson(
			'555-555-1234'
		)
		return { client, person }
	}

	private static async emitWhoAmI(client?: MercuryClient) {
		const [{ auth }] = await (client ?? this.client).emitAndFlattenResponses(
			'whoami::v2020_12_25'
		)
		return auth
	}

	private static async registerOwnerProxy() {
		return await this.client.registerProxyToken()
	}

	private static get client() {
		return fake.getClient()
	}
}
