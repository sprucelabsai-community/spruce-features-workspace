import { MercuryClient } from '@sprucelabs/mercury-client'
import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { assert, test } from '@sprucelabs/test'
import { errorAssertUtil } from '@sprucelabs/test-utils'
import { login } from '../..'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import { DEMO_NUMBER_ROLE_FIXTURE } from '../../tests/constants'
import seed from '../../tests/decorators/seed'
import RoleFixture from '../../tests/fixtures/RoleFixture'

type Role = SpruceSchemas.Spruce.v2020_07_22.Role

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
	protected static async listsValidRoles() {
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
	@seed('organizations', 1)
	protected static async listsWorkingRolesByDefault() {
		const allRoles = await this.listRoles()
		const expectedRoles = allRoles.filter(
			(role) => role.base !== 'anonymous' && role.base !== 'loggedIn'
		)

		await this.assertListedRolesMatchExpected(expectedRoles)
	}

	@test()
	@seed('organizations', 1)
	protected static async listMetaRolesWithOptions() {
		const allRoles = await this.listRoles()
		await this.assertListedRolesMatchExpected(allRoles, {
			shouldIncludeMetaRoles: true,
		})
	}

	@test()
	@seed('organizations', 3)
	protected static async canPassOwnOrg() {
		const orgs = await this.orgs.listOrganizations()
		const org = orgs[2]
		const roles = await this.fixture.listRoles({ organizationId: org.id })

		assert.isEqual(roles[0].organizationId, org.id)
	}

	private static async getNewestOrg() {
		const org = await this.orgs.getNewestOrganization()
		assert.isTruthy(org, `You gotta @seed('organizations',1) to continue.`)
		return org
	}

	private static async assertListedRolesMatchExpected(
		expectedRoles: Role[],
		options?: { shouldIncludeMetaRoles?: boolean }
	) {
		const roles = await this.fixture.listRoles(options)

		function sort(a: any, b: any) {
			return a.name > b.name ? 1 : -1
		}

		roles.sort(sort)
		expectedRoles.sort(sort)

		assert.isEqualDeep(roles, expectedRoles)
	}

	private static async listRoles() {
		const org = await this.getNewestOrg()

		const roleResults = await this.client.emit('list-roles::v2020_12_25', {
			target: {
				organizationId: org.id,
			},
			payload: {
				shouldIncludePrivateRoles: true,
				shouldIncludeMetaRoles: true,
			},
		})

		const { roles: allRoles } =
			eventResponseUtil.getFirstResponseOrThrow(roleResults)

		return allRoles
	}
}
