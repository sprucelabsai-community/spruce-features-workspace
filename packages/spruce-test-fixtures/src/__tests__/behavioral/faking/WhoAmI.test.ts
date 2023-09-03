import { Authenticator } from '@sprucelabs/heartwood-view-controllers'
import { MercuryClient } from '@sprucelabs/mercury-client'
import { assert, test } from '@sprucelabs/test-utils'
import { fake } from '../../..'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'

@fake.login()
export default class WhoAmITest extends AbstractSpruceFixtureTest {
	private static auth: Authenticator
	private static didLoginCount = 0

	protected static async beforeEach() {
		await super.beforeEach()
		this.cwd = this.resolveTestPath('skill')
		await this.emitRegister()
	}

	protected static async afterEach() {
		await super.afterEach()
		await this.emitRegister()
	}

	protected static async afterAll() {
		await super.afterAll()
		await this.emitRegister()
	}

	@test()
	protected static async canWhoAmI() {
		this.auth = this.views.getAuthenticator()
		await fake.getClient().emitAndFlattenResponses('whoami::v2020_12_25')

		this.views.getAuthenticator().addEventListener('did-login', async () => {
			this.didLoginCount++
		})
	}

	@test()
	protected static async authIsResetBeforeEachSoListenersAreReset() {
		assert.isNotEqual(this.views.getAuthenticator(), this.auth)
		await fake.getClient().emitAndFlattenResponses('whoami::v2020_12_25')
		assert.isEqual(this.didLoginCount, 0)
	}

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
		assert.isEqualDeep(auth.person, this.fakedPerson)
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
		const { client, person } =
			await this.people.loginAsDemoPerson('555-555-1234')
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

	protected static resolveTestPath(...pathAfterTestDirsAndFiles: string[]) {
		return this.resolvePath(
			__dirname,
			'..',
			'..',
			'testDirsAndFiles',
			...pathAfterTestDirsAndFiles
		)
	}

	private static async emitRegister() {
		await fake
			.getClient()
			.emitAndFlattenResponses('register-proxy-token::v2020_12_25')
	}
}
