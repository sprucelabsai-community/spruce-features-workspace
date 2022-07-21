import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { BASE_ROLES_WITH_META } from '@sprucelabs/spruce-core-schemas'
import { test, assert } from '@sprucelabs/test'
import { errorAssert, generateId } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import fake from '../../../tests/decorators/fake'
import seed from '../../../tests/decorators/seed'
import eventFaker from '../../../tests/eventFaker'
import { RoleBase } from '../../../types/fixture.types'
import { Organization } from '../../test.types'

@fake.login()
export default class FakingRoleEventsTest extends AbstractSpruceFixtureTest {
	private static org: Organization

	protected static async beforeEach() {
		await super.beforeEach()
		this.org = await this.organizations.seedDemoOrganization()
	}

	@test()
	protected static async canListOwners() {
		await this.assertPersonGetsBackRoleWithbase(fake.getPerson().id, 'owner')
	}

	@test()
	@seed('teammates', 1)
	protected static async canListOtherRoles() {
		const teammate = this.fakedTeammates[0]
		await this.assertPersonGetsBackRoleWithbase(teammate.id, 'teammate')
	}

	@test('can get role 1', 0)
	@test('can get role 2', 1)
	protected static async canGetRole(idx: number) {
		const id = this.fakedRoles[idx].id
		const role = await this.emitGetRole(id)

		assert.isEqualDeep(role, this.fakedRoles[idx])
	}

	@test()
	protected static async throwsWithBadRole() {
		const err = await assert.doesThrowAsync(() =>
			this.emitGetRole(generateId())
		)

		errorAssert.assertError(err, 'NOT_FOUND')
	}

	@test()
	@seed('locations', 1)
	@seed('organizations', 1)
	@seed('locations', 1)
	protected static async listingRolesByLocationFiltersByOrg() {
		await this.assertRolesMatchOrg(0)
		await this.assertRolesMatchOrg(1)
	}

	@test()
	@seed('organizations', 1)
	protected static async settingListenerOnListRolesResetsNextTest() {
		let hitCount = 0
		await eventFaker.on('list-roles::v2020_12_25', () => {
			hitCount++
			return {
				roles: [],
			}
		})

		const orgId = this.fakedOrganizations[0].id

		await this.afterEach()

		await this.roles.listRoles({
			organizationId: orgId,
		})

		assert.isEqual(hitCount, 0)
	}

	private static async assertRolesMatchOrg(idx: number) {
		const roles = await this.roles.listRoles({
			locationId: this.fakedLocations[idx].id,
			shouldIncludeMetaRoles: true,
		})
		assert.isLength(roles, BASE_ROLES_WITH_META.length)
		assert.isEqual(
			roles[0].organizationId,
			this.fakedLocations[idx].organizationId
		)
	}

	private static async emitGetRole(id: string) {
		const [{ role }] = await fake
			.getClient()
			.emitAndFlattenResponses('get-role::v2020_12_25', {
				target: {
					roleId: id,
				},
			})

		return role
	}

	private static async assertPersonGetsBackRoleWithbase(
		personId: string,
		base: RoleBase
	) {
		const roles = await this.listRolesForOrg(personId)
		assert.isEqualDeep(roles[0], this.getFakedRole(base))
	}

	private static getFakedRole(
		base: RoleBase
	): SpruceSchemas.Spruce.v2020_07_22.Role {
		return this.fakedRoles.find((r) => r.base === base)!
	}

	private static async listRolesForOrg(personId: string) {
		return await this.roles.listRoles({
			organizationId: this.org.id,
			personId,
		})
	}
}
