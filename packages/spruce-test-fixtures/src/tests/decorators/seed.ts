import { StoreName } from '@sprucelabs/data-stores'
import { MercuryTestClient } from '@sprucelabs/mercury-client'
import {
    EMPLOYED_BASE_ROLES,
    GUEST_BASE_ROLES,
} from '@sprucelabs/spruce-core-schemas'
import { assert } from '@sprucelabs/test-utils'
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

export default function seed(
    storeName: SeedTarget,
    totalToSeed?: number,
    ...params: any[]
) {
    return function (Class: any, key: string, descriptor: any) {
        if (
            (storeName === 'organizations' || storeName === 'locations') &&
            !Class.beforeAll.__patched
        ) {
            const beforeAll = Class.beforeAll.bind(Class)

            Class.__shouldResetAccount = false

            Class.beforeAll = async () => {
                await beforeAll()

                await login.on('did-login', async () => {
                    await forceResetAccount(Class)
                })

                await login.on('will-logout', async () => {
                    // await forceResetAccount(Class)
                    // if (shouldResetTestClientOnWillLogout) {
                    //
                    // 	MercuryTestClient.reset()
                    // }
                })
            }

            Class.beforeAll.__patched = true
        }

        StoreFixture.setShouldAutomaticallyResetDatabase(false)
        StoreFixture.resetDbConnectionSettings()

        const seed = attachSeeder(storeName, Class, totalToSeed, params)
        const bound = descriptor?.value?.bind?.(Class)

        attachCleanup(Class)

        descriptor.value = async (...args: any[]) => {
            await optionallyReset(Class, key)

            await seed()

            await bound?.(...args)
        }
    }
}

async function forceResetAccount(Class: any) {
    Class.__shouldResetAccount = true
    await reset(Class)
}

async function optionallyReset(Class: any, key: string) {
    if (Class.__lastReset !== key) {
        if (Class.__lastReset !== 'beforeEach') {
            await reset(Class)
        }
        Class.__lastReset = key
    }
}

async function reset(Class: any) {
    if (Class.__shouldResetAccount) {
        Class.__shouldResetAccount = false
        await Class.Fixture('seed').resetAccount()
    }
    await StoreFixture.reset()
}

let shouldResetTestClient = true

seed.disableResettingTestClient = () => {
    shouldResetTestClient = false
}

function attachCleanup(Class: any) {
    if (!Class.__attachedStoreAfterEach) {
        Class.__attachedStoreAfterEach = true
        const afterEach = Class.afterEach.bind(Class)
        const beforeEach = Class.beforeEach.bind(Class)

        Class.afterEach = async () => {
            await afterEach?.()

            shouldResetTestClient && MercuryTestClient.reset()
            delete Class.__lastReset
        }

        Class.beforeEach = async () => {
            await optionallyReset(Class, 'beforeEach')
            await beforeEach?.()
        }
    }
}

function attachSeeder(
    storeName: SeedTarget,
    TestClass: any,
    totalToSeed: number | undefined,
    params?: any[]
) {
    //@ts-ignore
    const fixtureMap: Record<SeedTarget, string> = {
        locations: 'seed',
        organizations: 'seed',
        teammates: 'seed',
        guests: 'seed',
        groupManagers: 'seed',
        managers: 'seed',
        owners: 'seed',
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

    const method = methodMap[storeName] ?? 'seed'
    const optionsKey = keyMap[storeName] ?? 'totalToSeed'
    const fixtureName = fixtureMap[storeName] ?? 'store'
    const options = { [optionsKey]: totalToSeed }

    return async function () {
        let fixture = TestClass.Fixture(fixtureName)

        if (fixtureName === 'store') {
            fixture = await fixture.Store(storeName)
            options.TestClass = TestClass
        } else {
            TestClass.__shouldResetAccount = true
        }

        assert.isFunction(
            fixture[method],
            `The '${storeName}' store you created needs a method called 'seed(options: StoreSeedOptions)' in order for seeding. You must implement it yourself... for now.`
        )

        const args = [options, ...(params ?? [])]

        await fixture[method](...args)
    }
}
