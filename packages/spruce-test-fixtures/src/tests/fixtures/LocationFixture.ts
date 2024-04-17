import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { assert } from '@sprucelabs/test-utils'
import { generateId } from '@sprucelabs/test-utils'
import OrganizationFixture from './OrganizationFixture'
import PersonFixture from './PersonFixture'
import RoleFixture from './RoleFixture'

export default class LocationFixture {
    private people: PersonFixture
    private orgs: OrganizationFixture
    private roles: RoleFixture
    private locationCounter = 0
    private static locationCount = 0

    public constructor(options: {
        people: PersonFixture
        organizations: OrganizationFixture
        roles: RoleFixture
    }) {
        this.people = options.people
        this.orgs = options.organizations
        this.roles = options.roles
    }

    public async seedDemoLocation(
        values?: Partial<SpruceSchemas.Mercury.v2020_12_25.CreateLocationEmitPayload> & {
            phone?: string
            organizationId?: string
        }
    ) {
        const { client } = await this.people.loginAsDemoPerson(values?.phone)
        let { organizationId: orgId, ...rest } = values ?? {}

        if (!orgId) {
            const last = await this.orgs.getNewestOrganization(values?.phone)
            if (last) {
                orgId = last.id
            } else {
                const org = await this.orgs.seedDemoOrganization({
                    name: 'Org to support seed location',
                    phone: values?.phone,
                })

                orgId = org.id
            }
        }

        const results = await client.emit('create-location::v2020_12_25', {
            target: {
                organizationId: orgId,
            },
            payload: {
                name: `Location ${LocationFixture.locationCount++} - ${generateId()}`,
                slug: this.generateLocationSlug(),
                isPublic: true,
                address: {
                    street1: '123 Main St',
                    city: 'Denver',
                    province: 'CO',
                    zip: '80211',
                    country: 'USA',
                },
                ...rest,
            },
        })

        const { location } = eventResponseUtil.getFirstResponseOrThrow(results)

        return location
    }

    private generateLocationSlug(): string {
        return `my-location-${new Date().getTime()}-${this
            .locationCounter++}-${Math.round(Math.random() * 1000)}`
    }

    public async getLocationById(id: string) {
        const { client } = await this.people.loginAsDemoPerson()

        const results = await client.emit('get-location::v2020_12_25', {
            target: {
                locationId: id,
            },
        })

        const { location } = eventResponseUtil.getFirstResponseOrThrow(results)

        return location
    }

    public async getNewestLocation(organizationId?: string) {
        const { client } = await this.people.loginAsDemoPerson()

        if (!organizationId) {
            const org = await this.orgs.getNewestOrganization()
            assert.isTruthy(
                org,
                `You gotta @seed('locations', 1) before you can get the newest location.`
            )
            organizationId = org.id
        }

        const results = await client.emit('list-locations::v2020_12_25', {
            target: {
                organizationId,
            },
            payload: {
                paging: {
                    pageSize: 1,
                },
            },
        })

        const { locations } = eventResponseUtil.getFirstResponseOrThrow(results)

        return locations.pop() ?? null
    }

    public async listLocations(organizationId?: string) {
        const { client } = await this.people.loginAsDemoPerson()

        if (!organizationId) {
            const org = await this.orgs.getNewestOrganization()
            if (!org) {
                throw new Error(
                    `You have to @seed('organizations',1) before you can list locations.`
                )
            }
            organizationId = org?.id
        }

        const results = await client.emit('list-locations::v2020_12_25', {
            target: {
                organizationId: organizationId as string,
            },
        })

        const { locations } = eventResponseUtil.getFirstResponseOrThrow(results)

        return locations
    }

    public async isPartOfLocation(options: {
        personId: string
        locationId: string
        phone?: string
    }) {
        const roles = await this.roles.listRoles(options)
        return roles.length > 0
    }

    public static beforeEach() {
        this.locationCount = 0
    }

    public async addPerson(options: {
        personId: string
        locationId: string
        organizationId?: string
        roleBase: string
        phone?: string
    }) {
        await this.roles.addRoleToPerson(options as any)
    }

    public async removePerson(options: {
        phone: string
        personId: string
        locationId: string
        organizationId: string
        roleBase: string
    }) {
        await this.roles.removeRoleFromPerson(options)
    }
}
