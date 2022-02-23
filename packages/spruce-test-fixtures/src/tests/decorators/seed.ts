import { StoreName } from '@sprucelabs/data-stores'
import { MercuryTestClient } from '@sprucelabs/mercury-client'
import { BASE_ROLES } from '@sprucelabs/spruce-core-schemas'
import { assert } from '@sprucelabs/test'
import SeedFixture from '../fixtures/SeedFixture'
import StoreFixture from '../fixtures/StoreFixture'
import login from './login'

type ROLES = typeof BASE_ROLES

type SeedTarget =
	| 'organizations'
	| 'locations'
	| `${ROLES[number]['slug']}s`
	| StoreName

export default function seed(
	storeName: SeedTarget,
	totalToSeed?: number,
	...params: any[]
) {
	return function (Class: any, key: string, descriptor: any) {
		if (storeName === 'organizations' || storeName === 'locations') {
			const beforeAll = Class.beforeAll.bind(Class)
			Class.beforeAll = async () => {
				await beforeAll()

				await login.on('did-login', async () => {
					await forceResetAccount(Class)
				})

				await login.on('will-logout', async () => {
					await forceResetAccount(Class)
				})
			}
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

function attachCleanup(Class: any) {
	if (!Class.__attachedStoreAfterEach) {
		Class.__attachedStoreAfterEach = true
		const afterEach = Class.afterEach.bind(Class)
		const beforeEach = Class.beforeEach.bind(Class)

		Class.afterEach = async () => {
			MercuryTestClient.reset()
			await afterEach?.()

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
