import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import OrganizationFixture from './OrganizationFixture'
import PersonFixture from './PersonFixture'
import RoleFixture from './RoleFixture'

export default class LocationFixture {
	private personFixture: PersonFixture
	private organizationFixture: OrganizationFixture
	private roleFixture: RoleFixture
	private locationCounter = 0

	public constructor(options: {
		personFixture: PersonFixture
		organizationFixture: OrganizationFixture
		roleFixture: RoleFixture
	}) {
		this.personFixture = options.personFixture
		this.organizationFixture = options.organizationFixture
		this.roleFixture = options.roleFixture
	}

	public async seedDemoLocation(
		values?: Partial<SpruceSchemas.Mercury.v2020_12_25.CreateLocationEmitPayload> & {
			phone?: string
			organizationId?: string
		}
	) {
		const { client } = await this.personFixture.loginAsDemoPerson(values?.phone)
		let { organizationId: orgId, ...rest } = values ?? {}

		if (!orgId) {
			const last = await this.organizationFixture.getNewestOrganization(
				values?.phone
			)
			if (last) {
				orgId = last.id
			} else {
				const org = await this.organizationFixture.seedDemoOrganization({
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
				name: 'Location from fixture',
				slug: this.generateLocationSlug(),
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
		const { client } = await this.personFixture.loginAsDemoPerson()

		const results = await client.emit('get-location::v2020_12_25', {
			target: {
				locationId: id,
			},
		})

		const { location } = eventResponseUtil.getFirstResponseOrThrow(results)

		return location
	}

	public async getNewestLocation(organizationId: string) {
		const { client } = await this.personFixture.loginAsDemoPerson()

		const results = await client.emit('list-locations::v2020_12_25', {
			target: {
				organizationId,
			},
			payload: {
				includePrivateLocations: true,
			},
		})

		const { locations } = eventResponseUtil.getFirstResponseOrThrow(results)

		return locations.pop() ?? null
	}

	public async listLocations(organizationId: string) {
		const { client } = await this.personFixture.loginAsDemoPerson()

		const results = await client.emit('list-locations::v2020_12_25', {
			target: {
				organizationId,
			},
			payload: {
				includePrivateLocations: true,
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
		const roles = await this.roleFixture.listRoles(options)
		return roles.length > 0
	}

	public async addPerson(options: {
		personId: string
		organizationId: string
		locationId: string
		roleBase: string
		phone?: string
	}) {
		const { personId, organizationId, locationId, roleBase, phone } = options

		const { client } = await this.personFixture.loginAsDemoPerson(phone)

		const role = await this.roleFixture.fetchFirstRoleWithBase({
			organizationId,
			base: roleBase,
			phone,
		})

		const roleId = role.id

		const setRoleResults = await client.emit('set-role::v2020_12_25', {
			target: {
				locationId,
			},
			payload: {
				personId,
				roleId,
			},
		})

		eventResponseUtil.getFirstResponseOrThrow(setRoleResults)
	}

	public async destory() {}
}
