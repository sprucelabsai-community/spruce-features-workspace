import { test, assert } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import fake from '../../../tests/decorators/fake'
import seed from '../../../tests/decorators/seed'

@fake.login()
export default class FakingAddingPeopleToAnOrgTest extends AbstractSpruceFixtureTest {
    @test()
    @seed('organizations', 1)
    @seed('owners', 1)
    protected static async canCreateFakingAddingPeopleToAnOrg() {
        assert.isLength(this.fakedOwners, 2)
    }

    @test()
    @seed('organizations', 1)
    @seed('teammates', 1)
    @seed('organizations', 1)
    @seed('teammates', 1)
    protected static async seedsDifferentTeammates() {
        this.assertSeededPeopleAreDifferent('fakedTeammates')
    }

    @test()
    @seed('organizations', 1)
    @seed('guests', 1)
    @seed('organizations', 1)
    @seed('guests', 1)
    protected static async seedsDifferentGuests() {
        this.assertSeededPeopleAreDifferent('fakedGuests')
    }

    @test()
    @seed('organizations', 1)
    @seed('managers', 1)
    @seed('organizations', 1)
    @seed('managers', 1)
    protected static async seedsDifferentManager() {
        this.assertSeededPeopleAreDifferent('fakedManagers')
    }

    @test()
    @seed('organizations', 1)
    @seed('groupManagers', 1)
    @seed('organizations', 1)
    @seed('groupManagers', 1)
    protected static async seedsDifferentGroupManager() {
        this.assertSeededPeopleAreDifferent('fakedGroupManagers')
    }

    @test()
    @seed('organizations', 1)
    @seed('owners', 1)
    @seed('organizations', 1)
    @seed('owners', 1)
    protected static async seedsDifferentOwners() {
        const [, person1, person2] = this.fakedOwners
        assert.isNotEqual(person1.id, person2.id)
    }

    @test()
    @seed('organizations', 1)
    @seed('teammates', 1)
    @seed('guests', 1)
    protected static async seedsDifferentTeammatesThenGuests() {
        const teammate = this.fakedTeammates[0]
        const guest = this.fakedGuests[0]
        assert.isNotEqual(teammate.id, guest.id)
    }

    @test()
    @seed('organizations', 1)
    @seed('teammates', 1)
    @seed('organizations', 1)
    @seed('teammates', 1)
    protected static async listingRolesHonorsOrgId() {
        const [teammate1, teammate2] = this.fakedTeammates
        const [org1, org2] = this.fakedOrganizations

        await this.assertTotalRolesReturned(org2.id, teammate1.id, 0)
        await this.assertTotalRolesReturned(org1.id, teammate2.id, 0)
        await this.assertTotalRolesReturned(org1.id, teammate1.id, 1)
        await this.assertTotalRolesReturned(org2.id, teammate2.id, 1)
    }

    @test()
    @seed('organizations', 1)
    @seed('teammates', 1)
    @seed('organizations', 1)
    protected static async removesRoleFromProperOrg() {
        const [teammate] = this.fakedTeammates
        const [org1, org2] = this.fakedOrganizations

        await this.organizations.addPerson({
            organizationId: org1.id,
            personId: teammate.id,
            roleBase: 'teammate',
        })

        await this.assertTotalRolesReturned(org1.id, teammate.id, 1)
        await this.assertTotalRolesReturned(org2.id, teammate.id, 1)

        await this.organizations.removePerson({
            personId: teammate.id,
            organizationId: org1.id,
            roleBase: 'teammate',
        })

        await this.assertTotalRolesReturned(org1.id, teammate.id, 0)
        await this.assertTotalRolesReturned(org2.id, teammate.id, 1)
    }

    private static async assertTotalRolesReturned(
        orgId: string,
        teammateId: string,
        expected: number
    ) {
        const roles = await this.roles.listRoles({
            organizationId: orgId,
            personId: teammateId,
        })

        assert.isLength(roles, expected)
    }

    private static assertSeededPeopleAreDifferent(
        key: keyof typeof AbstractSpruceFixtureTest
    ) {
        const [person1, person2] = this[key] as any
        assert.isNotEqual(person1.id, person2.id)
    }
}
