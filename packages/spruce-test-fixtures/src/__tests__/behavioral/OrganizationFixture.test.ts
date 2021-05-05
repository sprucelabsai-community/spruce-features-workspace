import { eventErrorAssertUtil } from '@sprucelabs/spruce-event-utils'
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
	protected static async orgFixtureDestroysOrgs() {
		const org = await this.fixture.seedDemoOrg({ name: 'my org' })
		await this.fixture.destory()
		await this.fixture.destory()

		const client = await this.Fixture('mercury').connectToApi()
		const results = await client.emit('get-organization::v2020_12_25', {
			target: {
				organizationId: org.id,
			},
		})

		eventErrorAssertUtil.assertErrorFromResponse(results, 'INVALID_TARGET')
	}
}
