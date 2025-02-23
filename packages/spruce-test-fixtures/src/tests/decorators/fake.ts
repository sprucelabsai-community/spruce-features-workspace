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
import { assert, SpruceTestResolver } from '@sprucelabs/test-utils'
import { generateId } from '@sprucelabs/test-utils'
import SpruceError from '../../errors/SpruceError'
import FakerTracker from '../../FakerTracker'
import AbstractSpruceFixtureTest from '../AbstractSpruceFixtureTest'
import eventFaker from '../eventFaker'
import generateRandomName from '../fixtures/generateRandomName'
import MercuryFixture from '../fixtures/MercuryFixture'
import ViewFixture from '../fixtures/ViewFixture'
import seed, { CoreSeedTarget } from './seed'

type Person = SpruceSchemas.Spruce.v2020_07_22.Person
type Location = SpruceSchemas.Spruce.v2020_07_22.Location
type Skill = SpruceSchemas.Spruce.v2020_07_22.Skill
type Role = SpruceSchemas.Spruce.v2020_07_22.Role

/** @ts-ignore */
type Client = MercuryClient

interface FakedData {
    fakedOwners?: Person[]
    fakedTeammates?: Person[]
    fakedManagers?: Person[]
    fakedGuests: Person[]
    fakedPeople: Person[]
    fakedSkills: Skill[]
    fakedGroupManagers: Person[]
}

interface Class {
    cwd: string
    __fakerSetup?: boolean
}

const strategies: Partial<
    Record<CoreSeedTarget, (total: number) => Promise<void> | void>
> = {
    organizations: seedOrganizations,
    locations: seedLocations,
    teammates: buildSeeder('teammates'),
    managers: buildSeeder('managers'),
    guests: buildSeeder('guests'),
    groupManagers: buildSeeder('groupManagers'),
    owners: buildSeeder('owners'),
}

function resetFakedRecords() {
    if (shouldSkipNextReset) {
        shouldSkipNextReset = false
        return
    }

    FakerTracker.resetFakedData()
}

export default function fake(target: CoreSeedTarget, total: number) {
    assertOptions({ target, total }, ['target', 'total'])

    return function (TestClass: any, _key: string, descriptor: any) {
        const Class = TestClass as Class
        const bound = descriptor?.value?.bind?.(Class)

        descriptor.value = async (...args: any[]) => {
            assert.isTruthy(
                FakerTracker.fakedPerson,
                `You gotta @faker.login(...) before you can create fake '${target}'!`
            )

            const strategy = strategies[target]

            assert.isTruthy(strategy, `Faking ${target} is not ready yet!`)

            await strategy?.(total)
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

    MercuryFixture.setShouldAutomaticallyClearDefaultClient(false)
    MercuryTestClient.setShouldRequireLocalListeners(true)
    MercuryClientFactory.setIsTestMode(true)
    ViewFixture.setShouldAutomaticallyResetAuth(false)

    seed.disableResettingTestClient()

    return function (TestClass: any, shouldPassHookCalls = true) {
        if (!(TestClass.prototype instanceof AbstractSpruceFixtureTest)) {
            testLog.warn(
                `@fake.login() is attached to an incompatible test class (${TestClass.name}). You can safely remove it or have your test class extend AbstractSpruceFixtureTest.`
            )
            return
        }

        if (shouldPassHookCalls) {
            const old = MercuryFixture.beforeEach.bind(MercuryFixture)
            MercuryFixture.beforeEach = async (...args: any[]) => {
                //@ts-ignore
                await old(...args)
                await setupFakeListeners()
            }
        }

        SpruceTestResolver.onDidCallBeforeAll(async () => {
            resetFakedRecords()

            await setupFakeListeners()

            await login(phone)

            MercuryFixture.setDefaultClient(FakerTracker.fakedClient)
        })

        SpruceTestResolver.onDidCallAfterEach(async () => {
            await setupFakeListeners()
        })

        SpruceTestResolver.onWillCallBeforeEach(async (TestClass) => {
            resetFakedRecords()
            await setupFakeListeners()

            if (!TestClass.cwd) {
                return
            }

            ViewFixture.resetAuth()

            try {
                if (FakerTracker.fakedPerson) {
                    const auth =
                        getFixturesForActiveTest().permissions.getAuthenticator()
                    auth.setSessionToken(
                        //@ts-ignore
                        FakerTracker.fakedClient.auth.token,
                        FakerTracker.fakedPerson!
                    )
                }
            } catch {
                //hits if not in skill because cant find nameplace
            }
        })
    }
}

fake.getClient = () => {
    return MercuryFixture.getDefaultClient() as Client
}

fake.getPerson = () => {
    //@ts-ignore
    return fake.getClient()!.auth!.person as Person
}

async function login(phone: string) {
    const { person, client } = await loginUsingViewsFallingBackToPeople(phone)

    if (!person.firstName) {
        givePersonName(person)
    }

    await client.registerProxyToken()

    //@ts-ignore
    client.auth.person = person
    FakerTracker.fakedClient = client
    FakerTracker.fakedPerson = person
}

async function loginUsingViewsFallingBackToPeople(phone: string) {
    let person: Person | undefined
    let client: MercuryClient | undefined

    try {
        const { person: p, client: c } =
            await getFixturesForActiveTest().views.loginAsDemoPerson(phone)
        person = p
        client = c
    } catch {
        const { person: p, client: c } =
            await getFixturesForActiveTest().people.loginAsDemoPerson(phone)
        person = p
        client = c
    }

    return {
        person: FakerTracker.fakedPeople.find((p) => p.id === person!.id)!,
        client,
    }
}

function givePersonName(person: SpruceSchemas.Spruce.v2020_07_22.Person) {
    const names = generateRandomName()
    person.casualName = buildCasualName(names)
    person.firstName = names.firstName
    person.lastName = names.lastName
}

async function setupFakeListeners() {
    await Promise.all([
        fakeSkillLifecycleEvents(),
        fakeGetPerson(),
        fakeRegisterProxyToken(),
        fakeWhoAmI(),
        fakeInstallEvents(),
        fakeAuthenticationEvents(),
        fakeAddRole(),
        fakeGetRole(),
        fakeRemoveRole(),
        fakeListRoles(),
        fakeListPeople(),
        fakeUpdatePerson(),
        fakeListLocations(),
        fakeGetLocation(),
        fakeUpdateLocation(),
        fakeDeleteOrganization(),
        fakeCreateLocation(),
        fakeCreateOrganization(),
        fakeGetOrganization(),
        fakeUpdateOrganization(),
        fakeListOrganization(),
        fakeRegisterListeners(),
    ])
}

async function fakeAddRole() {
    await eventFaker.on('add-role::v2020_12_25', ({ payload, target }) => {
        const { organizationId, locationId } = target ?? {}
        const { roleId } = payload

        const person = getPersonById(payload.personId)
        addPersonAsRoleToLocationOrOrg({
            roleId,
            person,
            organizationId,
            locationId,
        })

        return {}
    })
}

function addPersonAsRoleToLocationOrOrg(options: {
    roleId: string
    person: SpruceSchemas.Spruce.v2020_07_22.Person
    organizationId?: string | null
    locationId?: string | null
}) {
    const { roleId, person, organizationId, locationId } = options

    const role = getRoleById(roleId)
    const key = roleBaseToLocalFakedProp(role.base!)

    //@ts-ignore
    assert.isTruthy(FakerTracker[key], `Could not find property ${key}`)

    const idx = FakerTracker[key]!.findIndex((p) => p.id === person.id)
    if (idx === -1) {
        //@ts-ignore
        FakerTracker[key]!.unshift(person)
    }

    FakerTracker.fakedPeopleRoles.push({
        personId: person.id,
        roleId: role.id,
        organizationId,
        locationId,
    })
}

function getRoleById(roleId: string) {
    const role = FakerTracker.fakedRoles.find((r) => r.id === roleId)
    assert.isTruthy(role, `Could not load faked role with the id of ${roleId}.`)

    return role
}

async function fakeGetRole() {
    await eventFaker.on('get-role::v2020_12_25', ({ target }) => {
        const { roleId } = target
        const role = FakerTracker.fakedRoles.find((r) => r.id === roleId)
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

async function fakeRemoveRole() {
    await eventFaker.on('remove-role::v2020_12_25', ({ payload }) => {
        const { personId, roleId } = payload

        const role = getRoleById(roleId)

        const people = FakerTracker[roleBaseToLocalFakedProp(role.base!)]
        const idx = people?.findIndex((p) => p.id === personId) ?? -1

        people?.splice(idx, 1)

        FakerTracker.fakedPeopleRoles = FakerTracker.fakedPeopleRoles.filter(
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

function getPersonById(
    personId?: string | null,
    shouldThrowWhenNotFound = true
) {
    const person = FakerTracker.fakedPeople.find((p) => p.id === personId)
    if (!person && shouldThrowWhenNotFound) {
        throw new SpruceError({
            code: 'INVALID_TARGET',
            friendlyMessage: `I could not find the faked person with id '${personId}' you were looking for.`,
        })
    }
    return person!
}

async function fakeUpdatePerson() {
    await eventFaker.on(
        'update-person::v2020_12_25',
        ({ target, source, payload }) => {
            const person = FakerTracker.fakedPeople.find((p) =>
                target?.personId
                    ? p.id === target?.personId
                    : p.id === source?.personId
            )

            if (!person) {
                throw new SpruceError({
                    code: 'INVALID_TARGET',
                    friendlyMessage: `I could not update the faked person you were looking for!`,
                })
            }

            person.firstName = payload?.firstName
            person.lastName = payload?.lastName
            person.casualName = buildCasualName(person)

            return {
                person,
            }
        }
    )
}

async function fakeListRoles() {
    await eventFaker.on('list-roles::v2020_12_25', ({ target, payload }) => {
        let { personId, organizationId, locationId } = target ?? {}
        const { shouldIncludeMetaRoles, shouldIncludePrivateRoles } =
            payload ?? {}

        let roles: Role[] = []

        if (personId) {
            const personRoles = FakerTracker.fakedPeopleRoles
                .filter(
                    (p) =>
                        p.personId === personId &&
                        ((p.organizationId &&
                            p.organizationId === organizationId) ||
                            (p.locationId && p.locationId === locationId) ||
                            (!locationId && !organizationId))
                )
                .map((pr) => getRoleById(pr.roleId))

            roles = personRoles
        } else {
            if (locationId) {
                organizationId = FakerTracker.fakedLocations.find(
                    (l) => l.id === locationId
                )?.organizationId
            }
            roles = FakerTracker.fakedRoles.filter(
                (r) => r.organizationId === organizationId
            )
        }

        if (!shouldIncludeMetaRoles) {
            roles = roles.filter(
                (r) =>
                    META_BASE_ROLES.findIndex((m) => m.slug === r.base) === -1
            )
        }

        if (!shouldIncludePrivateRoles) {
            roles = roles.filter((r) => r.isPublic)
        }

        return {
            roles,
        }
    })
}

async function fakeListPeople() {
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
            const faked = getFakedRecordsByRoleBase(base)
            if (faked) {
                people.push(...faked)
            }
        }

        return {
            people: payload?.roleBases ? people : FakerTracker.fakedPeople,
        }
    })
}

function getFakedRecordsByRoleBase(base: string) {
    //@ts-ignore
    return FakerTracker[fakeTargetToPropName(singularToPlural(base))] as
        | Person[]
        | undefined
}

async function fakeListLocations() {
    await eventFaker.on(
        'list-locations::v2020_12_25',
        ({ target, payload }) => {
            return {
                locations: applyPaging(
                    FakerTracker.fakedLocations,
                    payload
                ).filter(
                    (l) =>
                        !target?.organizationId ||
                        l.organizationId === target?.organizationId
                ),
            }
        }
    )
}

async function fakeGetLocation() {
    await eventFaker.on('get-location::v2020_12_25', ({ target }) => {
        const match = FakerTracker.fakedLocations.find(
            (l) => l.id === target.locationId
        )
        if (!match) {
            throw new SpruceError({
                code: 'INVALID_TARGET',
                friendlyMessage: `I could not find that location (get-location::v2020_12_25)!\n\nTarget:${JSON.stringify(
                    { target }
                )}`,
            })
        }
        return {
            location: match,
        }
    })
}

async function fakeUpdateLocation() {
    await eventFaker.on(
        'update-location::v2020_12_25',
        ({ target, payload }) => {
            const { locationId } = target

            let idx = FakerTracker.fakedLocations.findIndex(
                (l) => l.id === locationId
            )

            if (!FakerTracker.fakedLocations[idx]) {
                throw new SpruceError({
                    code: 'INVALID_TARGET',
                    friendlyMessage: `I could not find that location to update!`,
                })
            }

            FakerTracker.fakedLocations[idx] = {
                ...FakerTracker.fakedLocations[idx],
                ...(payload as Location),
                dateUpdated: Date.now(),
            }

            return {
                location: FakerTracker.fakedLocations[idx],
            }
        }
    )
}

async function fakeDeleteOrganization() {
    await eventFaker.on(
        'delete-organization::v2020_12_25',
        ({ target: { organizationId } }) => {
            const idx = FakerTracker.fakedOrganizations.findIndex(
                (o) => o.id === organizationId
            )

            if (idx === -1) {
                throw new SpruceError({
                    code: 'INVALID_TARGET',
                    friendlyMessage: `I could not find that organization to delete!`,
                })
            }

            const match = FakerTracker.fakedOrganizations[idx]
            FakerTracker.fakedOrganizations.splice(idx, 1)

            return {
                organization: match,
            }
        }
    )
}

async function fakeCreateLocation() {
    await eventFaker.on(
        'create-location::v2020_12_25',
        ({ target, payload, source }) => {
            const { personId } = source ?? {}

            //@ts-ignore - delete when you find this (pushing through upgrades)
            const location: Location = {
                id: generateId(),
                dateCreated: new Date().getTime(),
                organizationId: target.organizationId,
                ...payload,
                slug: payload.slug ?? namesUtil.toKebab(payload.name),
            }

            FakerTracker.fakedLocations.unshift(location)

            if (personId) {
                const role = FakerTracker.fakedRoles.find(
                    (r) => r.base === 'owner'
                )!
                addPersonAsRoleToLocationOrOrg({
                    roleId: role.id,
                    person: FakerTracker.fakedPerson!,
                    locationId: location.id,
                })
            }

            return {
                location,
            }
        }
    )
}

async function fakeCreateOrganization() {
    await eventFaker.on('create-organization::v2020_12_25', ({ payload }) => {
        const organization = {
            id: generateId(),
            dateCreated: new Date().getTime(),
            isPublic: null,
            ...payload,
            slug: payload.slug ?? namesUtil.toKebab(payload.name),
        }

        FakerTracker.fakedOrganizations.unshift(organization)

        const roles = seedRoles(organization.id)

        addPersonAsRoleToLocationOrOrg({
            organizationId: organization.id,
            roleId: roles.find((r) => r.base === 'owner')!.id,
            person: FakerTracker.fakedPerson!,
        })

        return {
            organization,
        }
    })
}

async function fakeGetPerson() {
    await eventFaker.on('get-person::v2020_12_25', ({ target }) => {
        assert.isTruthy(
            target?.personId,
            `@fake only supports 'get-person::v2020_12_25' when passing an id. To fake more, use 'eventFaker.on(...)'.`
        )

        const person = getPersonById(target.personId)

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
    process.env.SKILL_ID = process.env.SKILL_ID || generateId()
    process.env.SKILL_API_KEY = process.env.SKILL_API_KEY || generateId()

    await eventFaker.on('register-skill::v2020_12_25', ({ payload }) => {
        const skill = {
            apiKey: generateId(),
            creators: [{ personId: FakerTracker.fakedPerson!.id }],
            dateCreated: new Date().getTime(),
            id: generateId(),
            ...payload,
            slug: payload.slug ?? generateId(),
        }

        FakerTracker.fakedSkills.unshift(skill)
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

async function fakeGetOrganization() {
    await eventFaker.on('get-organization::v2020_12_25', ({ target }) => {
        const match = findOrgFromTarget(target)
        return {
            organization: match,
        }
    })
}

async function fakeUpdateOrganization() {
    await eventFaker.on(
        'update-organization::v2020_12_25',
        ({ target, payload }) => {
            const match = findOrgFromTarget(target)

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

async function fakeListOrganization() {
    await eventFaker.on(
        'list-organizations::v2020_12_25',
        (targetAndPayload) => {
            const { payload } = targetAndPayload ?? {}

            return {
                organizations: applyPaging(
                    FakerTracker.fakedOrganizations,
                    payload
                ),
            }
        }
    )
}

function applyPaging<T>(records: T[], payload: any): T[] {
    let copy = [...records]
    if (payload?.paging?.pageSize) {
        copy = copy.slice(0, payload.paging.pageSize)
    }
    return copy as any[]
}

async function seedOrganizations(total: number) {
    await getFixturesForActiveTest().seeder.seedOrganizations({
        totalOrganizations: total,
    })
}

function seedRoles(orgId: string) {
    const roles = BASE_ROLES_WITH_META.map((r) => ({
        id: generateId(),
        name: `Faked ${r.name}`,
        base: r.slug,
        dateCreated: new Date().getTime(),
        organizationId: orgId,
        isPublic: r.slug === 'guest',
    }))
    FakerTracker.fakedRoles.push(...roles)

    return roles
}

async function seedLocations(total: number) {
    await getFixturesForActiveTest().seeder.seedAccount({
        totalLocations: total,
    })
}

function buildSeeder(target: CoreSeedTarget) {
    return async function seed(total: number) {
        if (FakerTracker.fakedLocations.length === 0) {
            assert.fail(
                `You gotta @seed('locations', 1) before seeding teammates!`
            )
        }

        //@ts-ignore
        await getFixturesForActiveTest().seeder[
            `seed${upperCaseFirst(target)}`
        ]({
            [`total${upperCaseFirst(target)}`]: total,
        })
    }
}

async function fakeWhoAmI() {
    await eventFaker.on('whoami::v2020_12_25', (targetAndPayload) => {
        const { source } = targetAndPayload ?? {}
        let { personId, proxyToken } = source ?? {}

        if (proxyToken) {
            personId = FakerTracker.fakedProxyTokens.find(
                (t) => t.token === proxyToken
            )?.personId
        }
        const person = getPersonById(personId, false)
        const skill = FakerTracker.fakedSkills.find(
            (s) => s.id === source?.skillId
        )

        return {
            auth: {
                skill,
                person,
            },
            type:
                person || skill
                    ? ('authenticated' as const)
                    : ('anonymous' as const),
        }
    })
}

async function fakeRegisterProxyToken() {
    await eventFaker.on(
        'register-proxy-token::v2020_12_25',
        (targeAndPayload) => {
            const { source } = targeAndPayload ?? {}
            const token = generateId()
            if (source?.personId) {
                FakerTracker.fakedProxyTokens.push({
                    personId: source!.personId!,
                    token,
                })
            }
            return {
                token,
            }
        }
    )
}

async function fakeAuthenticationEvents() {
    await eventFaker.on('request-pin::v2020_12_25', ({ payload }) => {
        const formattedPhone = formatPhoneNumber(payload.phone)
        let person = FakerTracker.fakedPeople.find(
            (p) => p.phone === formattedPhone
        )

        if (!person) {
            person =
                FakerTracker.fakedPerson?.phone === formattedPhone
                    ? FakerTracker.fakedPerson
                    : {
                          id: generateId(),
                          casualName: 'friend',
                          dateCreated: new Date().getTime(),
                          phone: formatPhoneNumber(formattedPhone),
                      }
            FakerTracker.fakedPeople.push(person)
        }

        return {
            challenge: person.phone as string,
        }
    })

    await eventFaker.on('confirm-pin::v2020_12_25', ({ payload }) => {
        const idx = FakerTracker.fakedPeople.findIndex(
            (p) => p.phone === payload.challenge
        )

        const person = FakerTracker.fakedPeople[idx]

        if (!person) {
            throw new SpruceError({
                code: 'INVALID_PIN' as any,
            })
        }

        //@ts-ignore
        delete person._challenge

        const token = generateId()
        FakerTracker.fakedTokens.push({
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

        let skill = FakerTracker.fakedSkills.find(
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

        const match = FakerTracker.fakedTokens.find((f) => f.token === token)

        if (!match) {
            //@ts-ignore
            throw new SpruceError({ code: 'INVALID_AUTH_TOKEN' })
        }

        const person = getPersonById(match.personId)

        return {
            type: 'authenticated' as const,
            auth: {
                person,
            },
        }
    })
}

async function fakeInstallEvents() {
    await eventFaker.on('is-skill-installed::v2020_12_25', ({ payload }) => {
        return {
            isInstalled: !!FakerTracker.fakedInstalledSkills.find(
                (i) => i.skillId === payload?.skillId
            ),
        }
    })

    await eventFaker.on('install-skill::v2020_12_25', ({ target, payload }) => {
        FakerTracker.fakedInstalledSkills.push({
            orgId: target.organizationId,
            skillId: payload.skillId,
        })

        return {}
    })

    await eventFaker.on('list-skills::v2020_12_25', ({ payload }) => {
        const namespaces = payload?.namespaces
        const matches = FakerTracker.fakedSkills.filter(
            (s) => (namespaces?.indexOf(s.slug) ?? 0) > -1
        )

        if (matches.length === 0) {
            throw new SpruceError({
                //@ts-ignore
                code: 'INVALID_NAMESPACES',
                namespaces,
                friendlyMessage:
                    'I could not find the skills by the namespaces you passed!',
            })
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
    return `faked${upperCaseFirst(target)}` as keyof FakedData
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

function findOrgFromTarget(target: EventTarget) {
    const match = FakerTracker.fakedOrganizations.find(
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

async function fakeRegisterListeners() {
    await eventFaker.on('register-listeners::v2020_12_25', async () => {})
}

function getFixturesForActiveTest() {
    const Test = SpruceTestResolver.getActiveTest()
    return FakerTracker.getFixtures(Test.cwd)
}
