import { test, assert, suite } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import {
    DEMO_NUMBER_LOCATION_FIXTURE_OUTSIDER,
    DEMO_NUMBER_LOCATION_FIXTURE,
} from '../../../tests/constants'
import fake from '../../../tests/decorators/fake'
import LocationFixture from '../../../tests/fixtures/LocationFixture'

@fake.login()
@suite()
export default class LocationFixtureInstanceTest extends AbstractSpruceFixtureTest {
    protected async beforeEach() {
        await super.beforeEach()

        assert.isInstanceOf(this, LocationFixtureInstanceTest)

        await this.seeder.resetAccount()
        await this.seeder.resetAccount(DEMO_NUMBER_LOCATION_FIXTURE_OUTSIDER)
    }

    @test()
    protected async canCreateWithSpecificOrg() {
        const org = await this.organizations.seedDemoOrganization({
            name: 'Location fixture org',
        })

        const location = await this.locations.seedDemoLocation({
            name: 'Location fixture location',
            organizationId: org.id,
        })

        assert.isEqual(org.id, location.organizationId)
    }

    @test()
    protected async canCreatLocationWithNoParams() {
        const location = await this.locations.seedDemoLocation({})
        assert.isTruthy(location)
    }

    @test()
    protected async isNotPartOfLocationToStart() {
        const location = await this.locations.seedDemoLocation({
            name: 'Location fixture location',
        })

        const { person } = await this.people.loginAsDemoPerson(
            DEMO_NUMBER_LOCATION_FIXTURE_OUTSIDER
        )

        const isHired = await this.locations.isPartOfLocation({
            personId: person.id,
            locationId: location.id,
            phone: DEMO_NUMBER_LOCATION_FIXTURE,
        })

        assert.isFalse(isHired)
    }

    @test()
    protected async uniqueLocationName() {
        const location1 = await this.locations.seedDemoLocation({})
        const location2 = await this.locations.seedDemoLocation({})
        assert.isNotEqual(location1.name, location2.name)
    }

    @test()
    protected async locationCountResetBeforeEach() {
        //@ts-ignore
        assert.isEqual(LocationFixture.locationCount, 0)
    }

    @test()
    protected async canAddPersonToLocation() {
        const { person, location } = await this.seedLocationAndAddPerson()

        const isHired = await this.isPersonPartOfLocation(
            person.id,
            location.id
        )

        assert.isTrue(isHired)
    }

    @test()
    protected async throwsWhenTryingToRemovePersonWithBadIds() {
        await assert.doesThrowAsync(() =>
            this.locations.removePerson({
                phone: DEMO_NUMBER_LOCATION_FIXTURE,
                personId: 'aoeu',
                locationId: 'aoeu',
                roleBase: 'test',
                organizationId: '234',
            })
        )
    }

    @test()
    protected async canRemoveRole() {
        const { person, location } = await this.seedLocationAndAddPerson()

        await this.locations.removePerson({
            phone: DEMO_NUMBER_LOCATION_FIXTURE,
            personId: person.id,
            locationId: location.id,
            organizationId: location.organizationId,
            roleBase: 'guest',
        })

        const isHired = await this.isPersonPartOfLocation(
            person.id,
            location.id
        )

        assert.isFalse(isHired)
    }

    private async isPersonPartOfLocation(personId: string, locationId: string) {
        return await this.locations.isPartOfLocation({
            phone: DEMO_NUMBER_LOCATION_FIXTURE,
            personId,
            locationId,
        })
    }

    protected async seedLocationAndAddPerson() {
        const org = await this.organizations.seedDemoOrganization({
            name: 'Location fixture org',
            phone: DEMO_NUMBER_LOCATION_FIXTURE,
        })

        await this.organizations.seedDemoOrganization({
            name: 'Outside org',
            phone: DEMO_NUMBER_LOCATION_FIXTURE_OUTSIDER,
        })

        const location = await this.locations.seedDemoLocation({
            name: 'Location fixture location',
            phone: DEMO_NUMBER_LOCATION_FIXTURE,
            organizationId: org.id,
        })

        const { person } = await this.people.loginAsDemoPerson(
            DEMO_NUMBER_LOCATION_FIXTURE_OUTSIDER
        )

        await this.locations.addPerson({
            personId: person.id,
            organizationId: org.id,
            locationId: location.id,
            roleBase: 'guest',
            phone: DEMO_NUMBER_LOCATION_FIXTURE,
        })

        return { location, person }
    }
}
