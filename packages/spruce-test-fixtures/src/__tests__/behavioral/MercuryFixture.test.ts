import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import FixtureFactory from '../../tests/fixtures/FixtureFactory'
import MercuryFixture from '../../tests/fixtures/MercuryFixture'

export default class MercuryFixtureTest extends AbstractSpruceTest {
	private static fixture: MercuryFixture

	protected static async beforeEach() {
		await super.beforeEach()
		this.fixture = FixtureFactory.Fixture('mercury')
	}

	@test()
	protected static async canCreateMercuryFixture() {
		assert.isTruthy(this.fixture)
	}

	@test()
	protected static async returnsConnectedClient() {
		const client = await this.fixture.connectToApi()
		assert.isTrue(client.isConnected())
		await client.disconnect()
	}

	@test()
	protected static async returnsSameClientOnSecondConnect() {
		const client = await this.fixture.connectToApi()
		//@ts-ignore
		client.__monkeyPatch = true
		const client2 = await this.fixture.connectToApi()
		//@ts-ignore
		assert.isTrue(client2.__monkeyPatch)
		await client.disconnect()
		assert.isFalse(client2.isConnected())
	}
}
