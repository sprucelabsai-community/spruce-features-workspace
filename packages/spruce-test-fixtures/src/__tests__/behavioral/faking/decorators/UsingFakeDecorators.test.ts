import { MercuryClient } from '@sprucelabs/mercury-client'
import { formatPhoneNumber } from '@sprucelabs/schema'
import { test, assert } from '@sprucelabs/test-utils'
import { errorAssert, generateId } from '@sprucelabs/test-utils'
import { seed, StoreFixture } from '../../../..'
import AbstractSpruceFixtureTest from '../../../../tests/AbstractSpruceFixtureTest'
import fake, {
    fakeTargetToPropName,
    pluralToSingular,
} from '../../../../tests/decorators/fake'
import { CoreSeedTarget } from '../../../../tests/decorators/seed'
import eventFaker from '../../../../tests/eventFaker'
import { SeedLocationValues } from '../../../../tests/fixtures/LocationFixture'
import MercuryFixture from '../../../../tests/fixtures/MercuryFixture'
// eslint-disable-next-line spruce/prohibit-import-from-build-folder
import GoodStore from '../../../testDirsAndFiles/one-good-store-skill/build/stores/Good.store'
import { DummyStore } from '../../databases/DummyStore'

@fake.login('555-000-0001')
export default class UsingFakeDecoratorsTest extends AbstractSpruceFixtureTest {
    private static wasBeforeAllInvoked = false
    private static wasBeforeEachInvoked = false
    private static client: MercuryClient

    protected static async beforeAll(): Promise<void> {
        await super.beforeAll()
        this.wasBeforeAllInvoked = true
    }

    @seed('dummies', 1)
    protected static async beforeEach(): Promise<void> {
        await super.beforeEach()
        this.wasBeforeEachInvoked = true
        this.client = await this.mercury.connectToApi()

        await this.client.emitAndFlattenResponses('whoami::v2020_12_25')
    }

    @test()
    protected static async resetsFakedOwners() {
        assert.isEqualDeep(this.fakedOwners, [])
    }

    @test()
    protected static async canGetClient() {
        assert.isEqual(MercuryFixture.getDefaultClient(), fake.getClient())
        assert.isEqual(this.fakedPerson, fake.getPerson())
    }

    @test()
    protected static async skillCallsHooks() {
        assert.isTrue(this.wasBeforeAllInvoked)
        assert.isTrue(this.wasBeforeEachInvoked)
    }

    @test()
    protected static async canSeedOrganization() {
        const org = await this.organizations.seedDemoOrganization({
            name: 'Test org',
        })

        assert.isEqual(org.name, 'Test org')
    }

    @test('can seed location to org 1', 0)
    @test('can seed location to org 2', 1)
    @seed('organizations', 2)
    protected static async seedingLocationSeedsToExpectedOrg(orgIdx: number) {
        const id = this.fakedOrganizations[orgIdx].id
        const location = await this.seedLocation({
            name: 'Test location',
            organizationId: id,
        })

        assert.isEqual(id, location.organizationId)
    }

    @test('list locations by org 1', 0)
    @test('list locations by org 0', 1)
    @seed('organizations', 1)
    @seed('locations', 2)
    @seed('organizations', 1)
    @seed('locations', 2)
    protected static async canSeedAndListLocations(orgIdx: number) {
        const id = this.fakedOrganizations[orgIdx].id
        const [{ locations }] = await this.client.emitAndFlattenResponses(
            'list-locations::v2020_12_25',
            {
                target: {
                    organizationId: id,
                },
            }
        )

        const expected = this.fakedLocations.filter(
            (l) => l.organizationId === id
        )
        assert.isEqualDeep(locations, expected)
    }

    @test('can seed teammates', 'teammates')
    @test('can seed managers', 'managers')
    @test('can seed guests', 'guests')
    @test('can seed groupManagers', 'groupManagers')
    @seed('locations', 1)
    @seed('teammates', 3)
    @seed('managers', 3)
    @seed('guests', 3)
    @seed('groupManagers', 3)
    protected static async canSeedTeammates(target: CoreSeedTarget) {
        let total = 3

        const { people, fakedRecords } = await this.assertFakedPeople(
            target,
            total
        )

        assert.doesNotInclude(people, this.fakedPerson)
        assert.isEqualDeep(people, fakedRecords)
    }

    @test()
    @seed('locations', 1)
    @seed('owners', 3)
    protected static async canSeedOwners() {
        await this.assertFakedPeople('owners', 4)
    }

    @test()
    @seed('locations', 1)
    protected static async whoAmIReturnsExpectedPerson() {
        const phone = formatPhoneNumber('555-111-1111')
        const { person, client } = await this.people.loginAsDemoPerson(phone)
        assert.isEqual(person.phone, phone)
        const [{ auth }] = await client.emitAndFlattenResponses(
            'whoami::v2020_12_25'
        )

        assert.isEqualDeep(auth.person, person)
    }

    @test()
    protected static async canSkillBeAnonLogin() {
        const client = await this.mercury.connectToApi({
            shouldReUseClient: false,
        })
        const [{ type }] = await client.emitAndFlattenResponses(
            'whoami::v2020_12_25'
        )
        assert.isEqualDeep(type, 'anonymous')
    }

    @test()
    @seed('locations', 1)
    @seed('teammates', 4)
    protected static async canListTeammatesByLocation() {
        const [{ people }] = await this.client.emitAndFlattenResponses(
            'list-people::v2020_12_25',
            {
                target: {
                    organizationId: this.fakedLocations[0].organizationId,
                    locationId: this.fakedLocations[0].id,
                },
            }
        )

        assert.isLength(people, 5)
    }

    @test()
    @seed('locations', 1)
    protected static async setsFakedOwners() {
        assert.isEqual(this.fakedPerson, this.fakedOwners[0])
    }

    @test()
    protected static someThingsThrowWhenNotFaked() {
        assert.doesThrow(() => this.fakedLocations)
    }

    @test()
    protected static async deletingOrgAndLocationDoesNotCrash() {
        await this.client.emit('delete-organization::v2020_12_25', {
            target: {
                organizationId: '1234',
            },
        })
    }

    @test()
    @seed('good')
    protected static canBeUsedWithSeedDecorator() {}

    @test('can get location by id 1', 0)
    @test('can get location by id 2', 1)
    @seed('locations', 3)
    protected static async canGetLocationById(idx: number) {
        const location = await this.emitGetLocationEvent(
            this.fakedLocations[idx].id
        )
        assert.isEqualDeep(location, this.fakedLocations[idx])
    }

    @test()
    protected static async throwsAsExpectedWithBadLocation() {
        const err = await assert.doesThrowAsync(() =>
            this.emitGetLocationEvent(generateId())
        )

        errorAssert.assertError(err, 'INVALID_TARGET')
    }

    @test()
    @seed('locations', 1)
    @seed('teammates', 1)
    @seed('managers', 1)
    protected static async canFilterByManyRolesAtOnceWhenListingPeople() {
        const [{ people }] = await this.client.emitAndFlattenResponses(
            'list-people::v2020_12_25',
            {
                payload: {
                    roleBases: ['teammate', 'manager'],
                },
            }
        )

        assert.isLength(people, 2)
    }

    @test('listing by people by role id throws', { roleIds: [] })
    @test('listing by people by person id throws', { personIds: [] })
    protected static async listingPeopleThrowsWhenDoingSomethingNotSupported(
        payload: any
    ) {
        await assert.doesThrowAsync(() =>
            this.client.emitAndFlattenResponses('list-people::v2020_12_25', {
                payload,
            })
        )
    }

    @test()
    protected static async throwingInRequestPinDoesNotCrashNextTest() {
        await eventFaker.makeEventThrow('request-pin::v2020_12_25')
    }

    @test()
    protected static async thisTestShouldNotCrashBecauseTestBeforeIt() {}

    @test()
    @seed('locations', 1)
    protected static async updateLocationThrowsWithBadLocationId() {
        const locationId = generateId()
        const values = {}

        const err = await assert.doesThrowAsync(() =>
            this.updateLocation(locationId, values)
        )

        errorAssert.assertError(err, 'INVALID_TARGET')
    }

    @test()
    protected static async canActuallyUpdateLocation() {
        const location = await this.seedLocation()
        const name = generateId()
        const num = generateId()
        await this.updateLocation(location.id, { name, num })
        this.assertLocationName(0, name)
        this.assertLocationNum(0, num)
    }

    @test()
    protected static async canUpdateTheSecondLocation() {
        await this.seedLocation()
        await this.seedLocation()
        const newName = generateId()
        const newNum = generateId()
        await this.updateLocation(this.fakedLocations[1].id, {
            name: newName,
            num: newNum,
        })
        this.assertLocationName(1, newName)
        this.assertLocationNum(1, newNum)
    }

    @test()
    @seed('locations', 1)
    protected static async retainsNameIfUpdatingJustNum() {
        const newNum = generateId()
        const originalName = this.fakedLocations[0].name
        await this.updateLocation(this.fakedLocations[0].id, { num: newNum })
        this.assertLocationName(0, originalName)
    }

    @test()
    protected static async updateReturnsProperLocation() {
        const location1 = await this.seedLocation()
        const location2 = await this.seedLocation()

        const actual1 = await this.updateLocation(location1.id, {})
        const actual2 = await this.updateLocation(location2.id, {})

        delete actual1.dateUpdated
        delete actual2.dateUpdated

        assert.isEqualDeep(actual1, location1)
        assert.isEqualDeep(actual2, location2)
    }

    @test()
    protected static async shouldBeAbleToOffListenersAndNotBreakEverything() {
        await this.client.off('whoami::v2020_12_25')
        await this.client.on('whoami::v2020_12_25', () => {
            return {
                auth: {},
                type: 'authenticated' as const,
            }
        })

        const results = await this.emitWhoAmI()
        assert.isLength(results, 1)
    }

    @test()
    protected static async thisWhoAmIShouldStillWork() {
        const [{ auth }] = await this.emitWhoAmI()
        const { client } = await this.views.loginAsDemoPerson()

        assert.isEqualDeep(DummyStore.lastFakedOwner, auth.person)

        //@ts-ignore
        assert.isEqualDeep(auth.person, client.auth.person)
        assert.isEqualDeep(auth.person, this.fakedPerson)
    }

    private static assertLocationNum(idx: number, num: string) {
        assert.isEqual(
            this.fakedLocations[idx].num,
            num,
            'Num should be updated'
        )
    }

    private static assertLocationName(idx: number, name: string) {
        assert.isEqual(
            this.fakedLocations[idx].name,
            name,
            'Name should be updated'
        )
    }

    private static async updateLocation(locationId: string, values: {}) {
        const [{ location }] = await this.fakedClient.emitAndFlattenResponses(
            'update-location::v2020_12_25',
            {
                target: {
                    locationId,
                },
                payload: {
                    ...values,
                },
            }
        )

        return location
    }

    protected static async emitGetLocationEvent(locationId: string) {
        const [{ location }] = await this.client.emitAndFlattenResponses(
            'get-location::v2020_12_25',
            {
                target: {
                    locationId,
                },
            }
        )

        return location
    }

    private static async emitWhoAmI() {
        return this.client.emitAndFlattenResponses('whoami::v2020_12_25')
    }

    private static async assertFakedPeople(target: string, total: number) {
        //@ts-ignore
        const fakedRecords = this[`${fakeTargetToPropName(target)}`] as any[]

        assert.isLength(fakedRecords, total)

        const people = await this.people.listPeople({
            locationId: this.fakedLocations[0].id,
            roleBases: [pluralToSingular(target)],
            organizationId: this.fakedLocations[0].organizationId,
        })

        assert.isLength(people, total)

        assert.isTruthy(fakedRecords[0].firstName)
        assert.isNotEqual(fakedRecords[0].casualName, 'friend')

        return { people, fakedRecords }
    }

    private static async seedLocation(values?: SeedLocationValues) {
        return await this.locations.seedDemoLocation(values)
    }
}

DummyStore.seedCb = async () => {
    fake.getPerson()

    //@ts-ignore
    DummyStore.lastFakedOwner = MercuryFixture.getDefaultClient()?.auth?.person
}
StoreFixture.setStore('good', GoodStore)
StoreFixture.setStore('dummies', DummyStore)
