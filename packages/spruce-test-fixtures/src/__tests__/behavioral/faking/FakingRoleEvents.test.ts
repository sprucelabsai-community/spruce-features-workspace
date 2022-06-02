import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { test, assert } from '@sprucelabs/test'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import fake from '../../../tests/decorators/fake'
import seed from '../../../tests/decorators/seed'
import { Organization, RoleBase } from '../../test.types'

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
