import { SpruceSchemas } from '@sprucelabs/mercury-types'
import LocationFixture from './LocationFixture'
import OrganizationFixture from './OrganizationFixture'

type Organization = SpruceSchemas.Spruce.v2020_07_22.Organization
type Location = SpruceSchemas.Spruce.v2020_07_22.Location

export default class SeedFixture {
	private organizationFixture: OrganizationFixture
	private locationFixture: LocationFixture

	public constructor(options: {
		organizationFixture: OrganizationFixture
		locationFixture: LocationFixture
	}) {
		this.organizationFixture = options.organizationFixture
		this.locationFixture = options.locationFixture
	}

	public async seedOrganizations(options?: {
		totalOrganizations?: number
		phone?: string
	}) {
		const { totalOrganizations, phone } = options ?? {}

		const orgs: Organization[] = await Promise.all(
			new Array(totalOrganizations ?? 3)
				.fill(0)
				.map(() => this.organizationFixture.seedDemoOrganization({ phone }))
		)

		return orgs
	}

	public async seedLocations(options: {
		totalLocations: number
		organizationId?: string
		phone?: string
	}) {
		let { totalLocations, organizationId, phone } = options

		const first = await this.locationFixture.seedDemoLocation({
			organizationId,
			phone,
		})

		organizationId = first.organizationId

		const locations: Location[] = await Promise.all(
			new Array(totalLocations - 1).fill(0).map(() =>
				this.locationFixture.seedDemoLocation({
					organizationId,
				})
			)
		)

		return [first, ...locations]
	}

	public async resetAccount(phone?: string) {
		await this.organizationFixture.deleteAllOrganizations(phone)
	}
}
