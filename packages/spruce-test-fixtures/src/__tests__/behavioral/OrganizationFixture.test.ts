import { test, assert } from '@sprucelabs/test'
import OrganizationFixture from '../../fixtures/OrganizationFixture'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'

export default class OrganizationFixtureTest extends AbstractSpruceFixtureTest {
	private static fixture: OrganizationFixture

	protected static async beforeEach() {
		await super.beforeEach()
		this.fixture = this.Fixture('organization')
	}

	@test()
	protected static async canCreateOrganizationFixture() {
		assert.isTruthy(this.fixture)
	}

	@test()
	protected static async canSeedOrg() {
		const org = await this.fixture.seedDemoOrg({ name: 'my org' })
		assert.isTruthy(org)
		assert.isEqual(org.name, 'my org')
	}

	@test()
	protected static async fixtureDestroysDependencies() {
		const { client } = await this.Fixture('person').loginAsDemoPerson()

		await this.fixture.destory()

		assert.isFalse(client.isConnected())
	}
}
