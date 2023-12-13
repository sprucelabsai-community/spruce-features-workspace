import { DatabaseFixture } from '@sprucelabs/data-stores'
import AbstractSpruceTest, { assert, test } from '@sprucelabs/test-utils'
import FixtureFactory from '../../../tests/fixtures/FixtureFactory'

export default class StoreFixtureTest extends AbstractSpruceTest {
	private static fixture: DatabaseFixture

	protected static async beforeEach() {
		await super.beforeEach()
		this.fixture = new FixtureFactory({ cwd: this.cwd }).Fixture('database')
	}

	@test()
	protected static async canGetDatabaseFixture() {
		assert.isTruthy(this.fixture)
	}

	@test()
	protected static async canConnectToDabatase() {
		const db = await this.fixture.connectToDatabase()
		assert.isTrue(db.isConnected())

		await DatabaseFixture.destroy()

		assert.isFalse(db.isConnected())
	}
}
