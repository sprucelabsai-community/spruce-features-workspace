import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import OrganizationFixture from './OrganizationFixture'
import PersonFixture from './PersonFixture'

export default class LocationFixture {
	private personFixture: PersonFixture
	private organizationFixture: OrganizationFixture
	private locationCounter = 0

	public constructor(options: {
		personFixture: PersonFixture
		organizationFixture: OrganizationFixture
	}) {
		this.personFixture = options.personFixture
		this.organizationFixture = options.organizationFixture
	}

	public async seedDemoLocation(
		values: Partial<SpruceSchemas.Mercury.v2020_12_25.CreateLocationEmitPayload> & {
			phone?: string
			organizationId?: string
		}
	) {
		const { client } = await this.personFixture.loginAsDemoPerson(values.phone)

		let { organizationId: orgId, ...rest } = values

		if (!orgId) {
			const org = await this.organizationFixture.seedDemoOrganization({
				name: 'Org to support seed location',
				phone: values.phone,
			})

			orgId = org.id
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
		return `my-location-${new Date().getTime()}-${this.locationCounter++}`
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

	public async destory() {}
}
