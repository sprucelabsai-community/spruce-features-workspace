import {
	MercuryClient,
	MercuryClientFactory,
	MercuryTestClient,
} from '@sprucelabs/mercury-client'
import { SpruceSchemas } from '@sprucelabs/mercury-types'
import {
	assertOptions,
	formatPhoneNumber,
	isValidNumber,
} from '@sprucelabs/schema'
import {
	BASE_ROLES_WITH_META,
	META_BASE_ROLES,
} from '@sprucelabs/spruce-core-schemas'
import { EventTarget } from '@sprucelabs/spruce-event-utils'
import { namesUtil, testLog } from '@sprucelabs/spruce-skill-utils'
import { assert } from '@sprucelabs/test'
import { generateId } from '@sprucelabs/test-utils'
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
type Skill = SpruceSchemas.Spruce.v2020_07_22.Skill
type Role = SpruceSchemas.Spruce.v2020_07_22.Role

/** @ts-ignore */
type Client = MercuryClient

interface ClassWithFakes {
	fakedOwners?: Person[]
	fakedTeammates?: Person[]
	fakedManagers?: Person[]
	fakedGuests: Person[]
	fakedPeople: Person[]
	fakedSkills: Skill[]
	fakedGroupManagers: Person[]
}

interface InstalledSkill {
	skillId: string
	orgId: string
}

type PersonRole = {
	roleId: string
	personId: string
	organizationId?: string | null
	locationId?: string | null
}

interface Class extends ClassWithFakes {
	fakedOwner?: Person
	_fakedOrganizations: Organization[]
	fakedInstalledSkills: InstalledSkill[]
	fakedPeopleRoles: PersonRole[]
	fakedProxyTokens: { personId: string; token: string }[]
	fakedTokens: { personId: string; token: string }[]
	fakedRoles: Role[]
	_fakedLocations: Location[]
	fakedOwnerClient: Client
	people: PersonFixture
	cwd: string
	__fakerSetup?: boolean
	beforeEach?: () => Promise<void>
	beforeAll?: () => Promise<void>
	afterEach?: () => Promise<void>
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
	Class.fakedInstalledSkills = []
	Class.fakedPeopleRoles = []
	Class.fakedManagers = []
	Class.fakedOwners = []
	Class.fakedGroupManagers = []
	Class.fakedGuests = []
	Class.fakedRoles = []
	Class.fakedPeople = []
	Class.fakedSkills = []
	Class.fakedTokens = []
	Class.fakedProxyTokens = []
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
				`@fake.login() is attached to an incompatible test class (${TestClass.name}). You can safely remove it or have your test class extend AbstractSpruceFixtureTest.`
			)
			return
		}

		const Class = TestClass as Class
		const beforeEach = Class.beforeEach?.bind(Class)
		const beforeAll = Class.beforeAll?.bind(Class)
		const afterEach = Class.afterEach?.bind(Class)

		if (shouldPassHookCalls) {
			const old = MercuryFixture.beforeEach.bind(MercuryFixture)
			MercuryFixture.beforeEach = async (...args: any[]) => {
				//@ts-ignore
				await old(...args)
				await setupFakes(Class)
				MercuryFixture.setDefaultClient(Class.fakedOwnerClient)
			}
		}

		Class.beforeAll = async () => {
			await beforeAll?.()
			resetFakes(Class)

			await setupFakes(Class)
			await login(Class, phone)

			MercuryFixture.setDefaultClient(Class.fakedOwnerClient)
		}

		Class.afterEach = async () => {
			await setupFakes(Class)
			await afterEach?.()
		}

		Class.beforeEach = async () => {
			await fakeAuthenticationEvents(Class)
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

	if (!person.firstName) {
		givePersonName(person)
	}

	Class.fakedPeople = [person]
	Class.fakedOwners = [person]
	Class.fakedOwner = person
	Class.fakedOwnerClient = client

	await client.registerProxyToken()
}

function givePersonName(person: SpruceSchemas.Spruce.v2020_07_22.Person) {
	const names = generateRandomName()
	person.casualName = buildCasualName(names)
	person.firstName = names.firstName
	person.lastName = names.lastName
}

async function setupFakes(Class: Class) {
	await Promise.all([
		fakeSkillLifecycleEvents(Class),
		fakeGetPerson(Class),
		fakeRegisterProxyToken(Class),
		fakeWhoAmI(Class),
		fakeInstallEvents(Class),
		fakeAuthenticationEvents(Class),
		fakeAddRole(Class),
		fakeGetRole(Class),
		fakeRemoveRole(Class),
		fakeListRoles(Class),
		fakeListPeople(Class),
		fakeUpdatePerson(Class),
		fakeListLocations(Class),
		fakeGetLocation(Class),
		fakeDeleteOrganization(Class),
		fakeCreateLocation(Class),
		fakeCreateOrganization(Class),
		fakeGetOrganization(Class),
		fakeUpdateOrganization(Class),
		fakeListOrganization(Class),
	])
}

async function fakeAddRole(Class: Class) {
	await eventFaker.on('add-role::v2020_12_25', ({ payload, target }) => {
		const { organizationId, locationId } = target ?? {}
		const { roleId } = payload

		const person = getPersonById(Class, payload.personId)
		addPersonAsRoleToLocationOrOrg({
			Class,
			roleId,
			person,
			organizationId,
			locationId,
		})

		return {}
	})
}

function addPersonAsRoleToLocationOrOrg(options: {
	Class: Class
	roleId: string
	person: SpruceSchemas.Spruce.v2020_07_22.Person
	organizationId?: string | null
	locationId?: string | null
}) {
	const { Class, roleId, person, organizationId, locationId } = options

	const role = getRoleById(Class, roleId)
	const key = roleBaseToLocalFakedProp(role.base!)

	//@ts-ignore
	assert.isTruthy(Class[key], `Could not find property ${key}`)

	const idx = Class[key]!.findIndex((p) => p.id === person.id)
	if (idx === -1) {
		//@ts-ignore
		Class[key]!.unshift(person)
	}

	Class.fakedPeopleRoles.push({
		personId: person.id,
		roleId: role.id,
		organizationId,
		locationId,
	})
}

function getRoleById(Class: Class, roleId: string) {
	const role = Class.fakedRoles.find((r) => r.id === roleId)
	assert.isTruthy(role, `Could not load faked role with the id of ${roleId}.`)

	return role
}

async function fakeGetRole(Class: Class) {
	await eventFaker.on('get-role::v2020_12_25', ({ target }) => {
		const { roleId } = target
		const role = Class.fakedRoles.find((r) => r.id === roleId)
		if (!role) {
			throw new SpruceError({
				code: 'NOT_FOUND',
				friendlyMessage: `I could not find a role with the id: '${roleId}'`,
			})
		}
		return {
			role,
		}
	})
}

async function fakeRemoveRole(Class: Class) {
	await eventFaker.on('remove-role::v2020_12_25', ({ payload }) => {
		const { personId, roleId } = payload

		const role = getRoleById(Class, roleId)

		const people = Class[roleBaseToLocalFakedProp(role.base!)]
		const idx = people?.findIndex((p) => p.id === personId) ?? -1

		people?.splice(idx, 1)

		Class.fakedPeopleRoles = Class.fakedPeopleRoles.filter(
			(p) => !(p.personId === personId && p.roleId === roleId)
		)

		return {}
	})
}

function roleBaseToLocalFakedProp(
	base: NonNullable<SpruceSchemas.Spruce.v2020_07_22.Role['base']>
) {
	return fakeTargetToPropName((base + 's') as CoreSeedTarget)
}

function getPersonById(Class: Class, personId?: string | null) {
	const person = Class.fakedPeople.find((p) => p.id === personId)
	assert.isTruthy(
		person,
		`Could not load faked person with the id of ${personId}.`
	)
	return person
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
	await eventFaker.on('list-roles::v2020_12_25', ({ target, payload }) => {
		let { personId, organizationId, locationId } = target ?? {}
		const { shouldIncludeMetaRoles } = payload ?? {}

		let roles: Role[] = []

		if (personId) {
			const personRoles = Class.fakedPeopleRoles
				.filter(
					(p) =>
						p.personId === personId &&
						((p.organizationId && p.organizationId === organizationId) ||
							(p.locationId && p.locationId === locationId) ||
							(!locationId && !organizationId))
				)
				.map((pr) => getRoleById(Class, pr.roleId))

			roles = personRoles
		} else {
			if (locationId) {
				organizationId = Class._fakedLocations.find(
					(l) => l.id === locationId
				)?.organizationId
			}
			roles = Class.fakedRoles.filter(
				(r) => r.organizationId === organizationId
			)
		}

		if (!shouldIncludeMetaRoles) {
			roles = roles.filter(
				(r) => META_BASE_ROLES.findIndex((m) => m.slug === r.base) === -1
			)
		}

		return {
			roles,
		}
	})
}

async function fakeListPeople(Class: Class) {
	await eventFaker.on('list-people::v2020_12_25', ({ payload }) => {
		let people: Person[] = []

		assert.isFalsy(
			payload?.roleIds,
			`@fake does not support listing people by roleIds. You will need to use 'eventFaker.on('list-people')' to fake your own response OR consider checking this.fakedPeople on your test class.`
		)

		assert.isFalsy(
			payload?.personIds,
			`@fake does not support listing people by personIds. You will need to use 'eventFaker.on(...)' to fake your own response OR consider checking this.fakedPeople on your test class`
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
	await eventFaker.on(
		'delete-organization::v2020_12_25',
		({ target: { organizationId } }) => {
			const idx = Class._fakedOrganizations.findIndex(
				(o) => o.id === organizationId
			)

			if (idx === -1) {
				throw new SpruceError({
					code: 'INVALID_TARGET',
					friendlyMessage: `I could not find that organization to delete!`,
				})
			}

			const match = Class._fakedOrganizations[idx]
			Class._fakedOrganizations.splice(idx, 1)

			return {
				organization: match,
			}
		}
	)
}

async function fakeCreateLocation(Class: Class) {
	await eventFaker.on(
		'create-location::v2020_12_25',
		({ target, payload, source }) => {
			const { personId } = source ?? {}

			const location: Location = {
				id: generateId(),
				dateCreated: new Date().getTime(),
				organizationId: target.organizationId,
				...payload,
				slug: payload.slug ?? namesUtil.toKebab(payload.name),
			}

			Class._fakedLocations.unshift(location)

			if (personId) {
				const role = Class.fakedRoles.find((r) => r.base === 'owner')!
				addPersonAsRoleToLocationOrOrg({
					Class,
					roleId: role.id,
					person: Class.fakedOwner!,
					locationId: location.id,
				})
			}

			return {
				location,
			}
		}
	)
}

async function fakeCreateOrganization(Class: Class) {
	await eventFaker.on('create-organization::v2020_12_25', ({ payload }) => {
		const organization = {
			id: generateId(),
			dateCreated: new Date().getTime(),
			isPublic: null,
			...payload,
			slug: payload.slug ?? namesUtil.toKebab(payload.name),
		}

		Class._fakedOrganizations.unshift(organization)

		const roles = seedRoles(Class, organization.id)

		addPersonAsRoleToLocationOrOrg({
			Class,
			organizationId: organization.id,
			roleId: roles.find((r) => r.base === 'owner')!.id,
			person: Class.fakedOwner!,
		})

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

async function fakeSkillLifecycleEvents(Class: Class) {
	process.env.SKILL_ID = process.env.SKILL_ID || generateId()
	process.env.SKILL_API_KEY = process.env.SKILL_API_KEY || generateId()

	await eventFaker.on('register-skill::v2020_12_25', ({ payload }) => {
		const skill = {
			apiKey: generateId(),
			creators: [{ personId: Class.fakedOwner!.id }],
			dateCreated: new Date().getTime(),
			id: generateId(),
			...payload,
			slug: payload.slug ?? generateId(),
		}

		Class.fakedSkills.unshift(skill)
		return {
			skill,
		}
	})

	await eventFaker.on('unregister-skill::v2020_12_25', () => ({}))
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
	return `${names.firstName ?? 'friend'} ${
		names.lastName ? names.lastName[0] + '.' : ''
	}`.trim()
}

async function fakeGetOrganization(Class: Class) {
	await eventFaker.on('get-organization::v2020_12_25', ({ target }) => {
		const match = findOrgFromTarget(Class, target)
		return {
			organization: match,
		}
	})
}

async function fakeUpdateOrganization(Class: Class) {
	await eventFaker.on(
		'update-organization::v2020_12_25',
		({ target, payload }) => {
			const match = findOrgFromTarget(Class, target)

			if (payload?.name) {
				match.name = payload.name
			}

			if (payload?.address) {
				match.address = payload.address
			}

			if (typeof payload?.isPublic !== 'undefined') {
				match.isPublic = payload.isPublic
			}

			const { ...copy } = match
			//@ts-ignore
			delete copy.id

			return {
				organization: copy,
			}
		}
	)
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
	const roles = BASE_ROLES_WITH_META.map((r) => ({
		id: generateId(),
		name: `Faked ${r.name}`,
		base: r.slug,
		dateCreated: new Date().getTime(),
		organizationId: orgId,
	}))
	Class.fakedRoles.push(...roles)

	return roles
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
	await eventFaker.on('whoami::v2020_12_25', (targetAndPayload) => {
		const { source } = targetAndPayload ?? {}
		let { personId, proxyToken } = source ?? {}

		if (proxyToken) {
			personId = Class.fakedProxyTokens.find(
				(t) => t.token === proxyToken
			)?.personId
		}
		const person = getPersonById(Class, personId)
		const skill = Class.fakedSkills.find((s) => s.id === source?.skillId)

		return {
			auth: {
				skill,
				person,
			},
			type:
				person || skill ? ('authenticated' as const) : ('anonymous' as const),
		}
	})
}

async function fakeRegisterProxyToken(Class: Class) {
	await eventFaker.on('register-proxy-token::v2020_12_25', ({ source }) => {
		const token = generateId()
		Class.fakedProxyTokens.push({
			personId: source!.personId!,
			token,
		})
		return {
			token,
		}
	})
}

async function fakeAuthenticationEvents(Class: Class) {
	await eventFaker.on('request-pin::v2020_12_25', ({ payload }) => {
		const formattedPhone = formatPhoneNumber(payload.phone)
		let person = Class.fakedPeople.find((p) => p.phone === formattedPhone)

		if (!person) {
			person =
				Class.fakedOwner?.phone === formattedPhone
					? Class.fakedOwner
					: {
							id: generateId(),
							casualName: 'friend',
							dateCreated: new Date().getTime(),
							phone: formatPhoneNumber(formattedPhone),
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

		const token = generateId()
		Class.fakedTokens.push({
			personId: person.id,
			token,
		})

		return {
			token,
			person: {
				...person,
			},
		}
	})

	await eventFaker.on('authenticate::v2020_12_25', ({ payload }) => {
		const { token, apiKey, skillId } = payload ?? {}

		let skill = Class.fakedSkills.find(
			(s) => s.apiKey === apiKey && s.id === skillId
		)

		if (
			!skill &&
			apiKey &&
			skillId &&
			apiKey === process.env.SKILL_API_KEY &&
			skillId === process.env.SKILL_ID
		) {
			skill = {
				id: skillId,
				apiKey,
				creators: [{ personId: 'aoeu' }],
				dateCreated: new Date().getTime(),
				name: 'Current skill',
				slug: 'unknown',
			}
		}

		if (skill) {
			return {
				type: 'authenticated' as const,
				auth: {
					skill,
				},
			}
		}

		const match = Class.fakedTokens.find((f) => f.token === token)

		if (!match) {
			//@ts-ignore
			throw new SpruceError({ code: 'INVALID_AUTH_TOKEN' })
		}

		const person = getPersonById(Class, match.personId)

		return {
			type: 'anonymous' as const,
			auth: {
				person,
			},
		}
	})
}

async function fakeInstallEvents(Class: Class) {
	await eventFaker.on('is-skill-installed::v2020_12_25', ({ payload }) => {
		return {
			isInstalled: !!Class.fakedInstalledSkills.find(
				(i) => i.skillId === payload?.skillId
			),
		}
	})

	await eventFaker.on('install-skill::v2020_12_25', ({ target, payload }) => {
		Class.fakedInstalledSkills.push({
			orgId: target.organizationId,
			skillId: payload.skillId,
		})

		return {}
	})

	await eventFaker.on('list-skills::v2020_12_25', ({ payload }) => {
		const namespaces = payload?.namespaces
		const matches = Class.fakedSkills.filter(
			(s) => (namespaces?.indexOf(s.slug) ?? 0) > -1
		)

		if (matches.length === 0) {
			//@ts-ignore
			throw new SpruceError({ code: 'INVALID_NAMESPACES', namespaces })
		}

		return {
			skills: matches.map((m) => {
				const { ...copy } = m
				//@ts-ignore
				delete copy.apiKey
				//@ts-ignore
				delete copy.creators

				return copy
			}),
		}
	})
}

export function fakeTargetToPropName(target: CoreSeedTarget) {
	return `faked${upperCaseFirst(target)}` as keyof ClassWithFakes
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

function findOrgFromTarget(Class: Class, target: EventTarget) {
	const match = Class._fakedOrganizations.find(
		(o: any) => o.id === target.organizationId
	)

	if (!match) {
		throw new SpruceError({
			code: 'INVALID_TARGET',
			friendlyMessage: `I could not find the organization you were looking for (get-organization::v2020_12_25).`,
		})
	}
	return match
}
