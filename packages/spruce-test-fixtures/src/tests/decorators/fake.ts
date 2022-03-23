import { generateId } from '@sprucelabs/data-stores'
import { MercuryTestClient } from '@sprucelabs/mercury-client'
import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { assertOptions, isValidNumber } from '@sprucelabs/schema'
import { namesUtil } from '@sprucelabs/spruce-skill-utils'
import { assert } from '@sprucelabs/test'
import SpruceError from '../../errors/SpruceError'
import eventFaker from '../eventFaker'
import generateRandomName from '../fixtures/generateRandomName'
import SeedFixture from '../fixtures/SeedFixture'
import { CoreSeedTargets } from './seed'

type Person = SpruceSchemas.Spruce.v2020_07_22.Person
type Organization = SpruceSchemas.Spruce.v2020_07_22.Organization
type Location = SpruceSchemas.Spruce.v2020_07_22.Location

interface Class {
	fakedOwner?: Person
	fakedOrganizations: Organization[]
	fakedLocations: Location[]
	__fakerSetup?: boolean
	beforeEach?: () => Promise<void>
	seeder: SeedFixture
}

const strategies: Partial<
	Record<CoreSeedTargets, (Class: Class, total: number) => Promise<void> | void>
> = {
	organizations: seedOrganizations,
	locations: seedLocations,
}

export default function fake(target: CoreSeedTargets, total: number) {
	assertOptions({ target, total }, ['target', 'total'])

	return async function (Class: Class) {
		assert.isTruthy(
			Class.fakedOwner,
			`You gotta @faker.login(...) before you can create fake '${target}'!`
		)

		setupCleanup(Class)

		await Promise.all([
			fakeListLocations(Class),
			fakeDeleteOrganization(Class),
			fakeCreateLocation(Class),
			fakeCreateOrganization(Class),
			fakeGetOrganization(Class),
			fakeListOrganization(Class),
		])

		await strategies[target]?.(Class, total)
	}
}

fake.login = (phone: string) => {
	assert.isTruthy(phone, `You need to pass a phone to 'faker.login(...)'`)
	assert.isTrue(
		isValidNumber(phone),
		`'${phone}' is not a valid phone. Try something like: 555-000-0000`
	)

	MercuryTestClient.setShouldRequireLocalListeners(true)

	return async function (Class: Class) {
		const person = generatePersonValues(phone, Class)

		await fakeWhoAmI(person)
		await fakeGetPerson(person)

		await eventFaker.on('request-pin::v2020_12_25', () => {
			return {
				challenge: '1234',
			}
		})

		await eventFaker.on('confirm-pin::v2020_12_25', () => {
			return {
				token: '1234',
				person,
			}
		})
	}
}

async function fakeListLocations(Class: Class) {
	await eventFaker.on('list-locations::v2020_12_25', ({ payload }) => {
		return {
			locations: applyPaging(Class.fakedLocations, payload),
		}
	})
}

async function fakeDeleteOrganization(Class: Class) {
	await eventFaker.on('delete-organization::v2020_12_25', () => {
		return {
			organization: Class.fakedOrganizations[0],
		}
	})
}

async function fakeCreateLocation(Class: Class) {
	await eventFaker.on('create-location::v2020_12_25', ({ payload }) => {
		const location = {
			id: generateId(),
			dateCreated: new Date().getTime(),
			organizationId: '234',
			...payload,
			slug: payload.slug ?? namesUtil.toKebab(payload.name),
		}

		Class.fakedLocations.unshift(location)

		return {
			location,
		}
	})
}

async function fakeCreateOrganization(Class: Class) {
	await eventFaker.on('create-organization::v2020_12_25', ({ payload }) => {
		const organization = {
			id: generateId(),
			dateCreated: new Date().getTime(),
			...payload,
			slug: payload.slug ?? namesUtil.toKebab(payload.name),
		}

		Class.fakedOrganizations.unshift(organization)

		return {
			organization,
		}
	})
}

async function fakeGetPerson(person: Person) {
	await eventFaker.on('get-person::v2020_12_25', ({ target }) => {
		assert.isTruthy(
			target?.personId,
			`@fake only supports 'get-person::v2020_12_25' when passing an id. To fake more, use 'eventFaker.on(...)'.`
		)

		if (target.personId !== person.id) {
			throw new SpruceError({
				code: 'INVALID_TARGET',
				friendlyMessage: `I could not find the person you were looking for.`,
			})
		}

		return {
			person,
		}
	})
}

function generatePersonValues(phone: string, Class: Class) {
	const names = generateRandomName()
	const person = {
		phone,
		dateCreated: new Date().getTime(),
		id: generateId(),
		casualName: `${names.firstName} ${
			names.lastName ? names.lastName[0] + '.' : ''
		}`,
		...names,
	}

	Class.fakedOwner = person
	return person
}

function setupCleanup(Class: Class) {
	if (!Class.__fakerSetup) {
		Class.__fakerSetup = true

		resetFakes(Class)

		const old = Class.beforeEach?.bind(Class)

		Class.beforeEach = async () => {
			resetFakes(Class)
			return old?.()
		}
	}
}

function resetFakes(Class: Class) {
	Class.fakedOrganizations = []
	Class.fakedLocations = []
}

async function fakeGetOrganization(Class: Class) {
	await eventFaker.on('get-organization::v2020_12_25', ({ target }) => {
		const match = Class.fakedOrganizations.find(
			(o: any) => o.id === target.organizationId
		)

		if (!match) {
			throw new SpruceError({
				code: 'INVALID_TARGET',
				friendlyMessage: `I could not find the organization you were looking for.`,
			})
		}
		return {
			organization: match,
		}
	})
}

async function fakeListOrganization(Class: Class) {
	await eventFaker.on('list-organizations::v2020_12_25', (targetAndPayload) => {
		const { payload } = targetAndPayload ?? {}

		return {
			organizations: applyPaging(Class.fakedOrganizations, payload),
		}
	})
}

function applyPaging<T>(records: T[], payload: any): T[] {
	let copy = [...records]
	if (payload?.paging?.pageSize) {
		copy = copy.slice(0, payload.paging.pageSize)
	}
	return copy as any[]
}

async function seedOrganizations(Class: Class, total: number) {
	await Class.seeder.seedOrganizations({
		totalOrganizations: total,
	})
}

async function seedLocations(Class: Class, total: number) {
	await Class.seeder.seedAccount({
		totalLocations: total,
	})
}

async function fakeWhoAmI(person: {
	firstName: string
	lastName: string
	phone: string
	dateCreated: number
	id: string
	casualName: string
}) {
	await eventFaker.on('whoami::v2020_12_25', () => {
		return {
			auth: {
				person,
			},
			type: 'authenticated' as const,
		}
	})
}
