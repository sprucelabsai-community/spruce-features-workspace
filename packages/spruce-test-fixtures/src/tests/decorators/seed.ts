import { StoreName } from '@sprucelabs/data-stores'
import { MercuryTestClient } from '@sprucelabs/mercury-client'
import {
    EMPLOYED_BASE_ROLES,
    GUEST_BASE_ROLES,
} from '@sprucelabs/spruce-core-schemas'
import { assert, SpruceTestResolver } from '@sprucelabs/test-utils'
import FakerTracker from '../../FakerTracker'
import FixtureWarehouse from '../fixtures/FixtureWarehourse'
import MercuryFixture from '../fixtures/MercuryFixture'
import SeedFixture from '../fixtures/SeedFixture'
import StoreFixture from '../fixtures/StoreFixture'
import login from './login'

type EMPLOYED = typeof EMPLOYED_BASE_ROLES
type GUEST = typeof GUEST_BASE_ROLES

export type CoreSeedTarget =
    | 'organizations'
    | 'locations'
    | `${EMPLOYED[number]['slug']}s`
    | `${GUEST[number]['slug']}s`

type SeedTarget = CoreSeedTarget | StoreName

interface ISeedTracker {
    isSeedingPatched: boolean
    shouldResetAccount: boolean
    lastReset?: string
    attachedStoreAfterEach: boolean
}

const SeedTracker: ISeedTracker = {
    isSeedingPatched: false,
    shouldResetAccount: false,
    attachedStoreAfterEach: false,
}

export default function seed(
    storeName: SeedTarget,
    totalToSeed?: number,
    ...params: any[]
) {
    return function (_Class: any, key: string, descriptor: any) {
        if (
            (storeName === 'organizations' || storeName === 'locations') &&
            !SeedTracker.isSeedingPatched
        ) {
            SeedTracker.shouldResetAccount = false

            SpruceTestResolver.onDidCallBeforeAll(async () => {
                await login.on('did-login', async () => {
                    await forceResetAccount()
                })
            })

            SeedTracker.isSeedingPatched = true
        }

        StoreFixture.setShouldAutomaticallyResetDatabase(false)
        StoreFixture.resetDbConnectionSettings()

        const seed = attachSeeder(storeName, totalToSeed, params)
        const unbound = descriptor?.value

        attachCleanup()

        descriptor.value = async (...args: any[]) => {
            await optionallyReset(key)

            await seed()

            const Test = SpruceTestResolver.getActiveTest()
            const allArgs = [Test, args]

            await unbound?.apply(...allArgs)
        }
    }
}

async function forceResetAccount() {
    SeedTracker.shouldResetAccount = true
    await reset()
}

async function optionallyReset(key: string) {
    if (SeedTracker.lastReset !== key) {
        if (SeedTracker.lastReset !== 'beforeEach') {
            await reset()
        }
        SeedTracker.lastReset = key
    }
}

async function reset() {
    if (SeedTracker.shouldResetAccount) {
        SeedTracker.shouldResetAccount = false
        const cwd = SpruceTestResolver.getActiveTest().cwd
        await FakerTracker.getFixtures(cwd).seeder.resetAccount()
    }
    await StoreFixture.reset()
}

let shouldResetTestClient = true

seed.disableResettingTestClient = () => {
    shouldResetTestClient = false
}

function attachCleanup() {
    if (!SeedTracker.attachedStoreAfterEach) {
        SeedTracker.attachedStoreAfterEach = true

        SpruceTestResolver.onWillCallBeforeEach(async (Class) => {
            MercuryFixture.setDefaultContractToLocalEventsIfExist(Class.cwd)
            await optionallyReset('beforeEach')
        })

        SpruceTestResolver.onDidCallAfterEach(async () => {
            shouldResetTestClient && MercuryTestClient.reset()
            delete SeedTracker.lastReset
        })
    }
}

function attachSeeder(
    storeName: SeedTarget,
    totalToSeed: number | undefined,
    params?: any[]
) {
    const fixtureMap: Partial<Record<SeedTarget, string>> = {
        locations: 'seeder',
        organizations: 'seeder',
        teammates: 'seeder',
        guests: 'seeder',
        groupManagers: 'seeder',
        managers: 'seeder',
        owners: 'seeder',
    }

    //@ts-ignore
    const methodMap: Record<SeedTarget, keyof SeedFixture> = {
        locations: 'seedAccount',
        organizations: 'seedOrganizations',
        teammates: 'seedTeammates',
        guests: 'seedGuests',
        groupManagers: 'seedGroupManagers',
        managers: 'seedManagers',
        owners: 'seedOwners',
    }

    //@ts-ignore
    const keyMap: Record<SeedTarget, string> = {
        locations: 'totalLocations',
        organizations: 'totalOrganizations',
        teammates: 'totalTeammates',
        guests: 'totalGuests',
        groupManagers: 'totalGroupManagers',
        managers: 'totalManagers',
        owners: 'totalOwners',
    }

    const method = (methodMap[storeName] ?? 'seed') as any
    const optionsKey = keyMap[storeName] ?? 'totalToSeed'
    const fixtureName = (fixtureMap[storeName] ??
        'stores') as keyof FixtureWarehouse
    const options = { [optionsKey]: totalToSeed }

    return async function () {
        const ActiveTest = SpruceTestResolver.getActiveTest()
        const fixtures = FakerTracker.getFixtures(ActiveTest.cwd)

        let fixture = fixtures[fixtureName]!

        if (fixtureName === 'stores') {
            fixture = await (fixture as StoreFixture).getStore(
                storeName as StoreName
            )
            options.TestClass = ActiveTest
        } else {
            SeedTracker.shouldResetAccount = true
        }

        assert.isFunction(
            fixture[method as keyof typeof fixture],
            `The '${storeName}' store you created needs a method called 'seed(options: StoreSeedOptions)' in order for seeding. You must implement it yourself... for now.`
        )

        const args = [options, ...(params ?? [])]

        //@ts-ignore
        await fixture[method](...args)
    }
}
