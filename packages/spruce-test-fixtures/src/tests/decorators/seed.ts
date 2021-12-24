import { StoreName } from '@sprucelabs/data-stores'
import { assert } from '@sprucelabs/test'
import { StoreFixture } from '../..'
import SeedFixture from '../fixtures/SeedFixture'
import login from './login'

type SeedTarget = 'organizations' | 'locations' | StoreName

export default function seed(storeName: SeedTarget, totalToSeed?: number) {
	return function (Class: any, key: string, descriptor: any) {
		if (storeName === 'organizations' || storeName === 'locations') {
			const beforeAll = Class.beforeAll.bind(Class)
			Class.beforeAll = async () => {
				await beforeAll()

				login.on('did-login', async () => {
					Class.__shouldResetAccount = true

					await reset(Class)
				})
			}
		}

		StoreFixture.setShouldAutomaticallyResetDatabase(false)
		StoreFixture.resetDbConnectionSettings()

		const seed = attachSeeder(storeName, Class, totalToSeed)
		const bound = descriptor?.value?.bind?.(Class)

		attachCleanup(Class)

		descriptor.value = async (...args: any[]) => {
			await optionallyReset(Class, key)

			await seed()

			await bound?.(...args)
		}
	}
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
	totalToSeed: number | undefined
) {
	//@ts-ignore
	const methodMap: Record<SeedTarget, keyof SeedFixture> = {
		locations: 'seedLocations',
		organizations: 'seedOrganizations',
	}

	//@ts-ignore
	const keyMap: Record<SeedTarget, string> = {
		locations: 'totalLocations',
		organizations: 'totalOrganizations',
	}

	//@ts-ignore
	const fixtureMap: Record<SeedTarget, string> = {
		locations: 'seed',
		organizations: 'seed',
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

		await fixture[method](options)
	}
}
