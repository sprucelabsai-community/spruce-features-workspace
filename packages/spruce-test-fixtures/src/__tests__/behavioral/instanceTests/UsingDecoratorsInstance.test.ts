import { AuthenticatorImpl } from '@sprucelabs/heartwood-view-controllers'
import { MercuryClient, MercuryClientFactory } from '@sprucelabs/mercury-client'
import { test, assert, suite } from '@sprucelabs/test-utils'
import { MercuryFixture, StoreFixture } from '../../..'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import { DEMO_NUMBER_DECORATORS } from '../../../tests/constants'
import login from '../../../tests/decorators/login'
import seed from '../../../tests/decorators/seed'
// eslint-disable-next-line spruce/prohibit-import-from-build-folder
import GoodStore from '../../testDirsAndFiles/one-good-store-skill/build/stores/Good.store'
import { DummyStore } from '../databases/DummyStore'

MercuryFixture.setShouldRequireLocalListeners(false)

@login(DEMO_NUMBER_DECORATORS)
@suite()
export default class UsingDecoratorsInstanceTest extends AbstractSpruceFixtureTest {
    private lastClient!: MercuryClient
    private goodStore!: GoodStore

    @seed('good', 5)
    @seed('dummies', 10)
    protected async beforeEach() {
        assert.isTrue(MercuryClientFactory.isInTestMode())
        this.goodStore = await this.Fixture('store').Store('good')

        await this.assertCountGoods(5)
        await super.beforeEach()

        const auth = AuthenticatorImpl.getInstance()
        assert.isTruthy(auth.getSessionToken())

        const client = login.getClient()
        const person = login.getPerson()

        //@ts-ignore
        assert.isEqualDeep(person, client.auth.person)

        assert.isTruthy(client)
        assert.isTrue(client.isConnected())
        assert.isTrue(client.getIsTestClient())

        this.lastClient = client

        //@ts-ignore
        assert.isEqualDeep(auth.getPerson(), client.auth.person)
        //@ts-ignore
        assert.isEqualDeep(auth.getSessionToken(), client.auth.token)

        this.goodStore = await this.Fixture('store').Store('good')

        await this.assertCountGoods(5)
    }

    protected static async afterAll() {
        await super.afterAll()
    }

    @test()
    protected async loginSetsDefaultClient() {
        const client = MercuryFixture.getDefaultClient()
        assert.isTruthy(client)

        assert.isTrue(client.isConnected())
    }

    @test()
    protected async retainsClientBetweenTests() {
        const client = MercuryFixture.getDefaultClient()

        assert.isTruthy(client)
        assert.isEqual(this.lastClient, client)
        assert.isTrue(client.isConnected())
    }

    @test()
    @seed('organizations', 3)
    protected async canSeedThreeOrgs() {
        await this.assertCountOrgs(3)
    }

    @test()
    @seed('organizations', 5)
    protected async canSeedFiveOrgs() {
        await this.assertCountOrgs(5)
    }

    @test()
    @seed('locations', 3)
    protected async canSeedTwoLocations() {
        await this.assertCountLocations(3)
    }

    @test()
    @seed('locations', 3)
    protected async seededLocationsArePublic() {
        const locations = await this.locations.listLocations()
        for (const location of locations) {
            assert.isTrue(location.isPublic)
        }
    }

    @test()
    @seed('locations', 10)
    protected async canSeedTenLocations() {
        await this.assertCountLocations(10)
    }

    @test()
    @seed('organizations', 10)
    @seed('locations', 10)
    protected async locationUsesLatestOrg() {
        await this.assertCountLocations(10)
        await this.assertCountOrgs(10)
    }

    @test()
    @seed('dummies', 10)
    protected async canSeedStores() {
        assert.isTrue(DummyStore.wasSeedInvoked)
        assert.isEqualDeep(DummyStore.seedOptions, {
            totalToSeed: 10,
            TestClass: this,
        })
    }

    @test()
    protected logsInViewAuthenticator() {
        assert.isTruthy(AuthenticatorImpl.getInstance().getSessionToken())
    }

    @test('passes through args 1', 1, 1, 1)
    @seed('dummies', 3)
    protected passesThroughArgs(one: number, two: number, three: number) {
        assert.isEqual(one, 1)
        assert.isEqual(two, 1)
        assert.isEqual(three, 1)
    }

    @test('passes through args 2', { hello: 'world' })
    @seed('dummies', 3)
    protected passesThroughArgs2(one: any) {
        assert.isEqualDeep(one, { hello: 'world' })
    }

    @test()
    @seed('good', 5)
    protected async seedsAddToBeforeEach() {
        await this.assertCountGoods(10)
    }

    @test()
    @seed('good', 1)
    protected async seedsAddToBeforeEachButNotLastRun() {
        await this.assertCountGoods(6)
    }

    @test()
    protected async canGetClientOffLogin() {
        assert.isFunction(login.getClient)
        assert.isEqual(login.getClient(), MercuryFixture.getDefaultClient())
    }

    @test()
    @seed('good', 1, 'hello', 'world')
    protected async storeGetsVariablesPassed() {
        assert.isEqualDeep(GoodStore.seedParams, ['hello', 'world'])
    }

    @test()
    @seed('good', 1, 'goodbye', 'people')
    protected async storeGetsVariablesPassed2() {
        assert.isEqualDeep(GoodStore.seedParams, ['goodbye', 'people'])
    }

    @test('can seed people', {
        guest: 2,
        teammate: 2,
        groupManager: 2,
        manager: 2,
        owner: 3,
    })
    @seed('organizations', 1)
    @seed('locations', 1)
    @seed('teammates', 2)
    @seed('guests', 2)
    @seed('groupManagers', 2)
    @seed('managers', 2)
    @seed('owners', 2)
    protected async canSeedPeople(baseCounts: Record<string, number>) {
        await this.assertExpectedSeededPeople(baseCounts)
    }

    @test('can seed more people', {
        guest: 5,
        teammate: 5,
        groupManager: 3,
        manager: 4,
        owner: 6,
    })
    @seed('organizations', 1)
    @seed('locations', 1)
    @seed('teammates', 5)
    @seed('guests', 5)
    @seed('groupManagers', 3)
    @seed('managers', 4)
    @seed('owners', 5)
    protected async canSeedMorePeople(baseCounts: Record<string, number>) {
        await this.assertExpectedSeededPeople(baseCounts)
    }

    @test()
    @seed('good', 1)
    protected async seedUsesSameStoreInstance() {
        const factory = await this.Fixture('store').getStoreFactory()
        const good = await factory.getStore('good')
        const count = await good.count({})

        assert.isEqual(count, 6)
    }

    private async assertExpectedSeededPeople(
        baseCounts: Record<string, number>
    ) {
        const bases = Object.keys(baseCounts)

        for (const base of bases) {
            const count = baseCounts[base]
            await this.assertTotalPeopleByRole(base, count)
        }
    }

    private async assertCountOrgs(expected: number) {
        const organizations = await this.organizations.listOrganizations()

        assert.isLength(organizations, expected)
    }

    private async assertCountLocations(expected: number) {
        const org = await this.views.getScope().getCurrentOrganization()

        assert.isTruthy(org)

        const organizationId = org.id
        const locations = await this.locations.listLocations(organizationId)

        assert.isLength(locations, expected)
    }

    private async assertCountGoods(expected: number) {
        const goodStore = await this.stores.Store('good')
        const count = await goodStore.count({})
        assert.isEqual(count, expected)
        const localCount = await this.goodStore.count({})
        assert.isEqual(
            localCount,
            expected,
            'The store built in beforeEach is pointing at stale database.'
        )
    }

    private async assertTotalPeopleByRole(roleBase: string, total: number) {
        const org = await this.organizations.getNewestOrganization()
        assert.isTruthy(
            org,
            'Did not find an organization. Did you forget to seed one?'
        )

        const loc = await this.locations.getNewestLocation(org.id)

        const teammates = await this.people.listPeople({
            organizationId: org.id,
            locationId: loc?.id,
            roleBases: [roleBase],
        })

        assert.isLength(teammates, total)
    }
}

declare module '@sprucelabs/data-stores/build/types/stores.types' {
    interface StoreMap {
        dummies: DummyStore
    }
}

StoreFixture.setStore('dummies', DummyStore)
StoreFixture.setStore('good', GoodStore)
