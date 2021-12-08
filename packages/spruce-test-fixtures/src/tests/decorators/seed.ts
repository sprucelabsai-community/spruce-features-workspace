import { StoreName } from '@sprucelabs/data-stores'
import { assert } from '@sprucelabs/test'
import { StoreFixture } from '../..'
import SeedFixture from '../fixtures/SeedFixture'

type SeedTarget = 'organizations' | 'locations' | StoreName

export default function seed(storeName: SeedTarget, totalToSeed?: number) {
	return function (Class: any, key: string, descriptor: any) {
		StoreFixture.setShouldAutomaticallyResetDatabase(false)
		StoreFixture.resetDbConnectionSettings()

		const seed = attachSeeder(storeName, Class, totalToSeed)
		const bound = descriptor?.value?.bind?.(Class)

		attachCleanup(Class)

		descriptor.value = async (...args: any[]) => {
			await seed()

			await bound?.(...args)
		}
	}
}

async function reset(Class: any) {
	await Class.Fixture('seed').resetAccount()
	await StoreFixture.reset()
}

function attachCleanup(Class: any) {
	if (!Class.__attachedStoreAfterEach) {
		Class.__attachedStoreAfterEach = true
		const afterEach = Class.afterEach.bind(Class)
		const beforeEach = Class.beforeEach.bind(Class)

		Class.afterEach = async () => {
			await afterEach?.()
		}

		Class.beforeEach = async () => {
			await reset(Class)
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
		}

		assert.isFunction(
			fixture[method],
			`The '${storeName}' store you created needs a method called 'seed(options: StoreSeedOptions)' in order for seeding. You must implement it yourself... for now.`
		)

		await fixture[method](options)
	}
}
