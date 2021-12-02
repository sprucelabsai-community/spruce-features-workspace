import { MercuryClient } from '@sprucelabs/mercury-client'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { assert, test } from '@sprucelabs/test'
import { errorAssertUtil } from '@sprucelabs/test-utils'
import { login } from '../..'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import { DEMO_NUMBER_ROLE_FIXTURE } from '../../tests/constants'
import seed from '../../tests/decorators/seed'
import RoleFixture from '../../tests/fixtures/RoleFixture'

@login(DEMO_NUMBER_ROLE_FIXTURE)
export default class RoleFixtureTest extends AbstractSpruceFixtureTest {
	private static fixture: RoleFixture
	private static client: MercuryClient

	protected static async beforeEach() {
		await super.beforeEach()
		this.fixture = this.Fixture('role')
		this.client = login.getClient()
	}

	@test()
	protected static hasRoleFixture() {
		assert.isTruthy(this.fixture)
	}

	@test()
	protected static async cantListRolesWithoutOrg() {
		const err = await assert.doesThrowAsync(() => this.fixture.listRoles())
		errorAssertUtil.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['organizationId'],
		})
	}

	@test()
	@seed('organizations', 1)
	protected static async canGetRoleByBase() {
		const roles = await this.fixture.listRoles()

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
	@seed('organizations', 3)
	protected static async canPassOwnOrg() {
		const orgs = await this.Fixture('organization').listOrganizations()
		const org = orgs[2]
		const roles = await this.fixture.listRoles({ organizationId: org.id })

		assert.isEqual(roles[0].organizationId, org.id)
	}
}
