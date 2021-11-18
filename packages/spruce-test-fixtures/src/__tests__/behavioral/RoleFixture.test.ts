import { MercuryClient } from '@sprucelabs/mercury-client'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { assert, test } from '@sprucelabs/test'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import { DEMO_NUMBER_ROLE_FIXTURE } from '../../tests/constants'
import MercuryFixture from '../../tests/fixtures/MercuryFixture'
import RoleFixture from '../../tests/fixtures/RoleFixture'

export default class RoleFixtureTest extends AbstractSpruceFixtureTest {
	private static fixture: RoleFixture
	private static client: MercuryClient

	protected static async beforeEach() {
		await super.beforeEach()
		this.fixture = this.Fixture('role')

		const { client } = await this.Fixture('person').loginAsDemoPerson(
			DEMO_NUMBER_ROLE_FIXTURE
		)

		MercuryFixture.setDefaultClient(client)
		this.client = client
	}

	@test()
	protected static hasRoleFixture() {
		assert.isTruthy(this.fixture)
	}

	@test()
	protected static async canGetRoleByBase() {
		const roles = await this.fixture.getRoles()

		assert.isArray(roles)
		assert.isAbove(roles.length, 0)

		for (const role of roles) {
			const results = await this.client.emit('get-role::v2020_12_25', {
				target: {
					roleId: role.id,
				},
			})

			eventResponseUtil.getFirstResponseOrThrow(results)
		}
	}

	@test()
	protected static async canPassOwnOrg() {
		const org = await this.Fixture('organization').seedDemoOrganization()
		const roles = await this.fixture.getRoles({ organizationId: org.id })

		assert.isEqual(roles[0].organizationId, org.id)
	}
}
