import { test, assert } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import fake from '../../../tests/decorators/fake'
import seed from '../../../tests/decorators/seed'

@fake.login()
export default class FakingAddingPeopleToALocationTest extends AbstractSpruceFixtureTest {
    @test()
    @seed('locations', 1)
    protected static async noRolesAtLocationToStart() {
        const { person } = await this.people.loginAsDemoPerson('555-555-1234')
        await this.assertIsNotPartOfLocation(person.id)
    }

    @test()
    @seed('organizations', 1)
    @seed('teammates', 1)
    @seed('locations', 1)
    protected static async differenciatesBetweenOrgAndLocation() {
        await this.assertIsNotPartOfLocation(this.fakedTeammates[0].id)
    }

    @test()
    @seed('locations', 1)
    protected static async passesWhenFakedOwnerIsPartOfLocation() {
        const is = await this.isPartOfLocation(this.fakedPerson.id)
        assert.isTrue(is)
    }

    private static async assertIsNotPartOfLocation(personId: string) {
        const is = await this.isPartOfLocation(personId)
        assert.isFalse(is)
    }

    private static async isPartOfLocation(personId: string) {
        return await this.locations.isPartOfLocation({
            personId,
            locationId: this.fakedLocations[0].id,
        })
    }
}
