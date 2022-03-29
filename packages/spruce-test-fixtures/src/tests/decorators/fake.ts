import { generateId } from '@sprucelabs/data-stores'
import {
	MercuryClient,
	MercuryClientFactory,
	MercuryTestClient,
} from '@sprucelabs/mercury-client'
import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { assertOptions, isValidNumber } from '@sprucelabs/schema'
import { BASE_ROLES } from '@sprucelabs/spruce-core-schemas'
import { namesUtil, testLog } from '@sprucelabs/spruce-skill-utils'
import { assert } from '@sprucelabs/test'
import SpruceError from '../../errors/SpruceError'
import AbstractSpruceFixtureTest from '../AbstractSpruceFixtureTest'
import eventFaker from '../eventFaker'
import generateRandomName from '../fixtures/generateRandomName'
import MercuryFixture from '../fixtures/MercuryFixture'
import PersonFixture from '../fixtures/PersonFixture'
import SeedFixture from '../fixtures/SeedFixture'
import seed, { CoreSeedTarget } from './seed'

type Person = SpruceSchemas.Spruce.v2020_07_22.Person
type Organization = SpruceSchemas.Spruce.v2020_07_22.Organization
type Location = SpruceSchemas.Spruce.v2020_07_22.Location
type Role = SpruceSchemas.Spruce.v2020_07_22.Role

/** @ts-ignore */
type Client = MercuryClient

interface Class {
	fakedOwner?: Person
	fakedOwners?: Person[]
	fakedTeammates?: Person[]
	fakedManagers?: Person[]
	fakedGuests: Person[]
	fakedPeople: Person[]
	fakedGroupManagers: Person[]
	_fakedOrganizations: Organization[]
	fakedRoles: Role[]
	_fakedLocations: Location[]
	fakedOwnerClient: Client
	people: PersonFixture
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
	if (shouldSkipNextReset) {
		shouldSkipNextReset = false
		return
	}
	Class._fakedOrganizations = []
	Class._fakedLocations = []
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

fake.login = (phone = '555-000-0000') => {
	assert.isTruthy(phone, `You need to pass a phone to 'faker.login(...)'`)
	assert.isTrue(
		isValidNumber(phone),
		`'${phone}' is not a valid phone. Try something like: 555-000-0000`
	)

	MercuryTestClient.setShouldRequireLocalListeners(true)
	MercuryClientFactory.setIsTestMode(true)

	seed.disableResettingTestClient()

	return function (TestClass: any, shouldPassHookCalls = true) {
		if (!(TestClass.prototype instanceof AbstractSpruceFixtureTest)) {
			testLog.warn(
				`@fake.login() is attached to an incompatible test class. You can safely remove it or have your test class extend AbstractSpruceFixtureTest.`
			)
			return
		}

		const Class = TestClass as Class
		const beforeEach = Class.beforeEach?.bind(Class)

		if (shouldPassHookCalls) {
			const old = MercuryFixture.beforeEach.bind(MercuryFixture)
			MercuryFixture.beforeEach = async (...args: any[]) => {
				//@ts-ignore
				await old(...args)
				await setupFakes(Class)
				MercuryFixture.setDefaultClient(Class.fakedOwnerClient)
			}
		}

		const beforeAll = Class.beforeAll?.bind(Class)
		Class.beforeAll = async () => {
			await beforeAll?.()
			resetFakes(Class)

			await setupFakes(Class)
			await login(Class, phone)
			MercuryFixture.setDefaultClient(Class.fakedOwnerClient)
		}

		Class.beforeEach = async () => {
			resetFakes(Class)

			if (!TestClass.cwd) {
				return
			}

			await login(Class, phone)

			shouldPassHookCalls && (await beforeEach?.())
		}
	}
}

fake.getClient = () => {
	return MercuryFixture.getDefaultClient() as Client
}

fake.getPerson = () => {
	//@ts-ignore
	return fake.getClient()!.auth!.person as Person
}

async function login(Class: Class, phone: string) {
	const { person, client } = await Class.people.loginAsDemoPerson(phone)

	givePersonName(person)

	Class.fakedPeople = [person]
	Class.fakedOwners = [person]
	Class.fakedOwner = person
	Class.fakedOwnerClient = client
}

function givePersonName(person: SpruceSchemas.Spruce.v2020_07_22.Person) {
	const names = generateRandomName()
	person.casualName = buildCasualName(names)
	person.firstName = names.firstName
	person.lastName = names.lastName
}

async function setupFakes(Class: Class) {
	await Promise.all([
		fakeSkillLifecycleEvents(),
		fakeGetPerson(Class),
		fakeWhoAmI(Class),
		fakeAuthenticationEvents(Class),
		fakeAddRole(Class),
		fakeListRoles(Class),
		fakeListPeople(Class),
		fakeUpdatePerson(Class),
		fakeListLocations(Class),
		fakeGetLocation(Class),
		fakeDeleteOrganization(Class),
		fakeCreateLocation(Class),
		fakeCreateOrganization(Class),
		fakeGetOrganization(Class),
		fakeListOrganization(Class),
	])
}

async function fakeAddRole(Class: Class) {
	await eventFaker.on('add-role::v2020_12_25', ({ payload }) => {
		const person = getPersonById(Class, payload.personId)
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

function getPersonById(Class: Class, personId?: string | null) {
	return Class.fakedPeople.find((p) => p.id === personId)!
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
		assert.isFalsy(
			target?.locationId,
			`You can't list roles by location id when faking (yet). For now you'll have to 'eventFaker.on(...)' to get things to work!`
		)

		assert.isFalsy(
			target?.personId,
			`You can't list roles by person id when faking (yet). For now you'll have to 'eventFaker.on(...)' to get things to work!`
		)

		return {
			roles: Class.fakedRoles.filter(
				(r) => r.organizationId === target?.organizationId
			),
		}
	})
}

async function fakeListPeople(Class: Class) {
	await eventFaker.on('list-people::v2020_12_25', ({ payload }) => {
		let people: Person[] = []

		assert.isFalsy(
			payload?.roleIds,
			`@fake does not support listing people by roleIds. You will need to use 'eventFaker.on(...)' to fake your own response.`
		)

		assert.isFalsy(
			payload?.personIds,
			`@fake does not support listing people by personIds. You will need to use 'eventFaker.on(...)' to fake your own response.`
		)

		for (const base of payload?.roleBases ?? []) {
			const faked = getFakedRecordsByRoleBase(Class, base)
			if (faked) {
				people.push(...faked)
			}
		}

		return {
			people: payload?.roleBases ? people : Class.fakedPeople,
		}
	})
}

function getFakedRecordsByRoleBase(Class: Class, base: string) {
	//@ts-ignore
	return Class[fakeTargetToPropName(singularToPlural(base))] as
		| Person[]
		| undefined
}

async function fakeListLocations(Class: Class) {
	await eventFaker.on('list-locations::v2020_12_25', ({ target, payload }) => {
		return {
			locations: applyPaging(Class._fakedLocations, payload).filter(
				(l) => l.organizationId === target.organizationId
			),
		}
	})
}

async function fakeGetLocation(Class: Class) {
	await eventFaker.on('get-location::v2020_12_25', ({ target }) => {
		const match = Class._fakedLocations.find((l) => l.id === target.locationId)
		if (!match) {
			throw new SpruceError({
				code: 'INVALID_TARGET',
				friendlyMessage: `I could not find that location (get-location::v2020_12_25)!`,
			})
		}
		return {
			location: match,
		}
	})
}

async function fakeDeleteOrganization(Class: Class) {
	await eventFaker.on('delete-organization::v2020_12_25', () => {
		return {
			organization: Class._fakedOrganizations[0],
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

		Class._fakedLocations.unshift(location)

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

		Class._fakedOrganizations.unshift(organization)

		seedRoles(Class, organization.id)

		return {
			organization,
		}
	})
}

async function fakeGetPerson(Class: Class) {
	await eventFaker.on('get-person::v2020_12_25', ({ target }) => {
		assert.isTruthy(
			target?.personId,
			`@fake only supports 'get-person::v2020_12_25' when passing an id. To fake more, use 'eventFaker.on(...)'.`
		)

		const person = getPersonById(Class, target.personId)

		if (!person) {
			throw new SpruceError({
				code: 'INVALID_TARGET',
				friendlyMessage: `I could not find the person you were looking for (get-person::v2020_12_25).`,
			})
		}

		return {
			person,
		}
	})
}

async function fakeSkillLifecycleEvents() {
	await eventFaker.on('unregister-listeners::v2020_12_25', () => ({
		unregisterCount: 0,
	}))

	await eventFaker.on('sync-event-contracts::v2020_12_25', () => ({
		fqens: ['did-sync'],
	}))
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
		const match = Class._fakedOrganizations.find(
			(o: any) => o.id === target.organizationId
		)

		if (!match) {
			throw new SpruceError({
				code: 'INVALID_TARGET',
				friendlyMessage: `I could not find the organization you were looking for (get-organization::v2020_12_25).`,
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
			organizations: applyPaging(Class._fakedOrganizations, payload),
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
		if (Class._fakedLocations.length === 0) {
			assert.fail(`You gotta @seed('locations', 1) before seeding teammates!`)
		}

		//@ts-ignore
		await Class.seeder[`seed${upperCaseFirst(target)}`]({
			[`total${upperCaseFirst(target)}`]: total,
		})
	}
}

async function fakeWhoAmI(Class: Class) {
	await eventFaker.on('whoami::v2020_12_25', (payload) => {
		const person = getPersonById(Class, payload?.source?.personId)

		return {
			auth: {
				person,
			},
			type: person ? ('authenticated' as const) : ('anonymous' as const),
		}
	})
}

async function fakeAuthenticationEvents(Class: Class) {
	await eventFaker.on('request-pin::v2020_12_25', ({ payload }) => {
		let person = Class.fakedPeople.find((p) => p.phone === payload.phone)

		if (!person) {
			person = {
				id: generateId(),
				casualName: 'friend',
				dateCreated: new Date().getTime(),
				phone: payload.phone,
			}
			Class.fakedPeople.push(person)
		}

		return {
			challenge: person.phone as string,
		}
	})

	await eventFaker.on('confirm-pin::v2020_12_25', ({ payload }) => {
		const idx = Class.fakedPeople.findIndex(
			(p) => p.phone === payload.challenge
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

export function fakeTargetToPropName(target: CoreSeedTarget) {
	return `faked${upperCaseFirst(target)}`
}

function upperCaseFirst(target: string) {
	return target[0].toUpperCase() + target.substring(1)
}

export function pluralToSingular(target: string): string {
	return target.substring(0, target.length - 1)
}

export function singularToPlural(target: string): string {
	return target + 's'
}

let shouldSkipNextReset = false
