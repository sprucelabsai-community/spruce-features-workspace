import { generateId } from '@sprucelabs/data-stores'
import { MercuryTestClient } from '@sprucelabs/mercury-client'
import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { assertOptions, isValidNumber } from '@sprucelabs/schema'
import { BASE_ROLES } from '@sprucelabs/spruce-core-schemas'
import { namesUtil } from '@sprucelabs/spruce-skill-utils'
import { assert } from '@sprucelabs/test'
import SpruceError from '../../errors/SpruceError'
import eventFaker from '../eventFaker'
import generateRandomName from '../fixtures/generateRandomName'
import SeedFixture from '../fixtures/SeedFixture'
import { CoreSeedTarget } from './seed'

type Person = SpruceSchemas.Spruce.v2020_07_22.Person
type Organization = SpruceSchemas.Spruce.v2020_07_22.Organization
type Location = SpruceSchemas.Spruce.v2020_07_22.Location
type Role = SpruceSchemas.Spruce.v2020_07_22.Role

interface Class {
	fakedOwner?: Person
	fakedOwners?: Person[]
	fakedTeammates?: Person[]
	fakedManagers?: Person[]
	fakedGuests: Person[]
	fakedPeople: Person[]
	fakedGroupManagers: Person[]
	fakedOrganizations: Organization[]
	fakedRoles: Role[]
	fakedLocations: Location[]
	cwd: string
	__fakerSetup?: boolean
	beforeEach?: () => Promise<void>
	beforeAll?: () => Promise<void>
	seeder: SeedFixture
}

const strategies: Partial<
	Record<CoreSeedTarget, (Class: Class, total: number) => Promise<void> | void>
> = {
	organizations: seedOrganizations,
	locations: seedLocations,
	teammates: buildSeeder('teammates'),
	managers: buildSeeder('managers'),
	guests: buildSeeder('guests'),
	groupManagers: buildSeeder('groupManagers'),
	owners: buildSeeder('owners'),
}

function resetFakes(Class: Class) {
	Class.fakedOrganizations = []
	Class.fakedLocations = []
	Class.fakedTeammates = []
	Class.fakedManagers = []
	Class.fakedOwners = []
	Class.fakedGroupManagers = []
	Class.fakedGuests = []
	Class.fakedRoles = []
	Class.fakedPeople = []
}

export default function fake(target: CoreSeedTarget, total: number) {
	assertOptions({ target, total }, ['target', 'total'])

	return function (TestClass: any, _key: string, descriptor: any) {
		const Class = TestClass as Class
		const bound = descriptor?.value?.bind?.(Class)

		descriptor.value = async (...args: any[]) => {
			assert.isTruthy(
				Class.fakedOwner,
				`You gotta @faker.login(...) before you can create fake '${target}'!`
			)

			const strategy = strategies[target]

			assert.isTruthy(strategy, `Faking ${target} is not ready yet!`)

			await strategy?.(Class, total)
			await bound?.(...args)
		}
	}
}

fake.login = (phone: string) => {
	assert.isTruthy(phone, `You need to pass a phone to 'faker.login(...)'`)
	assert.isTrue(
		isValidNumber(phone),
		`'${phone}' is not a valid phone. Try something like: 555-000-0000`
	)

	MercuryTestClient.setShouldRequireLocalListeners(true)

	return function (TestClass: any, shouldPassHookCalls = true) {
		const Class = TestClass as Class

		const beforeEach = Class.beforeEach?.bind(Class)
		const owner = generatePersonValues(phone)
		Class.fakedOwner = owner

		Class.beforeEach = async () => {
			resetFakes(Class)

			Class.fakedPeople.push(owner)
			Class.fakedOwners = [owner]

			await fakeLoginEvents(owner, Class)
			await setupFakes(Class)

			shouldPassHookCalls && (await beforeEach?.())

			await fakeLoginEvents(owner, Class)
			await setupFakes(Class)
		}
	}
}

async function fakeLoginEvents(
	owner: {
		firstName: string
		lastName: string
		phone: string
		dateCreated: number
		id: string
		casualName: string
	},
	Class: Class
) {
	await fakeWhoAmI(owner)
	await fakeGetPerson(owner)

	await eventFaker.on('request-pin::v2020_12_25', ({ payload }) => {
		let createdPerson = {
			id: generateId(),
			casualName: 'friend',
			dateCreated: new Date().getTime(),
			phone: payload.phone,
			_challenge: generateId(),
		}

		Class.fakedPeople.push(createdPerson)

		return {
			challenge: createdPerson._challenge,
		}
	})

	await eventFaker.on('confirm-pin::v2020_12_25', ({ payload }) => {
		const idx = Class.fakedPeople.findIndex(
			//@ts-ignore
			(p) => p._challenge === payload.challenge
		)

		const person = Class.fakedPeople[idx]

		if (!person) {
			throw new SpruceError({
				code: 'INVALID_PIN' as any,
			})
		}

		//@ts-ignore
		delete person._challenge

		return {
			token: '1234',
			person: {
				...person,
			},
		}
	})
}

async function setupFakes(Class: Class) {
	await Promise.all([
		fakeAddRole(Class),
		fakeListRoles(Class),
		fakeListPeople(Class),
		fakeUpdatePerson(Class),
		fakeListLocations(Class),
		fakeDeleteOrganization(Class),
		fakeCreateLocation(Class),
		fakeCreateOrganization(Class),
		fakeGetOrganization(Class),
		fakeListOrganization(Class),
	])
}

async function fakeAddRole(Class: Class) {
	await eventFaker.on('add-role::v2020_12_25', ({ payload }) => {
		const person = Class.fakedPeople.find((p) => p.id === payload.personId)!
		const role = Class.fakedRoles.find((r) => r.id === payload.roleId)!

		//@ts-ignore
		const key = `${fakeTargetToPropName(role.base!)}s`

		//@ts-ignore
		assert.isTruthy(Class[key], `Could not find property ${key}`)

		//@ts-ignore
		Class[key]!.push(person)

		return {}
	})
}

async function fakeUpdatePerson(Class: Class) {
	await eventFaker.on(
		'update-person::v2020_12_25',
		({ target, source, payload }) => {
			const person = Class.fakedPeople.find(
				(p) => p.id === source?.personId || p.id === target?.personId
			)!

			person.firstName = payload?.firstName
			person.lastName = payload?.lastName
			person.casualName = buildCasualName(person)

			return {
				person,
			}
		}
	)
}

async function fakeListRoles(Class: Class) {
	await eventFaker.on('list-roles::v2020_12_25', ({ target }) => {
		return {
			roles: Class.fakedRoles.filter(
				(r) => r.organizationId === target?.organizationId
			),
		}
	})
}

async function fakeListPeople(Class: Class) {
	await eventFaker.on('list-people::v2020_12_25', ({ payload }) => {
		const base = payload?.roleBases?.[0]

		return {
			//@ts-ignore
			people: Class[fakeTargetToPropName(base + 's')],
		}
	})
}

async function fakeListLocations(Class: Class) {
	await eventFaker.on('list-locations::v2020_12_25', ({ target, payload }) => {
		return {
			locations: applyPaging(Class.fakedLocations, payload).filter(
				(l) => l.organizationId === target.organizationId
			),
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
	await eventFaker.on('create-location::v2020_12_25', ({ target, payload }) => {
		const location = {
			id: generateId(),
			dateCreated: new Date().getTime(),
			organizationId: target.organizationId,
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

		seedRoles(Class, organization.id)

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

function generatePersonValues(phone: string) {
	const names = generateRandomName()
	const person = {
		phone,
		dateCreated: new Date().getTime(),
		id: generateId(),
		casualName: buildCasualName(names),
		...names,
	}

	return person
}

function buildCasualName(names: {
	firstName?: string | null
	lastName?: string | null
}) {
	return `${names.firstName} ${
		names.lastName ? names.lastName[0] + '.' : 'friend'
	}`
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

function seedRoles(Class: Class, orgId: string) {
	Class.fakedRoles = BASE_ROLES.map((r) => ({
		id: generateId(),
		name: `Faked ${r.name}`,
		base: r.slug,
		dateCreated: new Date().getTime(),
		organizationId: orgId,
	}))
}

async function seedLocations(Class: Class, total: number) {
	await Class.seeder.seedAccount({
		totalLocations: total,
	})
}

function buildSeeder(target: CoreSeedTarget) {
	return async function seed(Class: Class, total: number) {
		if (Class.fakedLocations.length === 0) {
			assert.fail(`You gotta @fake('locations', 1) before seeding teammates!`)
		}

		//@ts-ignore
		await Class.seeder[`seed${upperCaseFirst(target)}`]({
			[`total${upperCaseFirst(target)}`]: total,
		})
	}
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

export function fakeTargetToPropName(target: CoreSeedTarget) {
	return `faked${upperCaseFirst(target)}`
}

function upperCaseFirst(target: string) {
	return target[0].toUpperCase() + target.substring(1)
}

export function pluralToSingular(target: string): string {
	return target.substring(0, target.length - 1)
}
