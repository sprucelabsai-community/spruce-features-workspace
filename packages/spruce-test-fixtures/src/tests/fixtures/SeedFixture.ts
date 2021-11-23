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

	public async seedOrganizations(options: { totalOrganizations: number }) {
		const orgs: Organization[] = await Promise.all(
			new Array(options.totalOrganizations)
				.fill(0)
				.map(() => this.organizationFixture.seedDemoOrganization())
		)

		return orgs
	}

	public async seedLocations(options: {
		totalLocations: number
		organizationId?: string
	}) {
		let { totalLocations, organizationId } = options

		if (!organizationId) {
			const org = await this.organizationFixture.seedDemoOrganization()
			organizationId = org.id
		}

		const locations: Location[] = await Promise.all(
			new Array(totalLocations).fill(0).map(() =>
				this.locationFixture.seedDemoLocation({
					organizationId,
				})
			)
		)

		return locations
	}

	public async resetAccount() {
		await this.organizationFixture.deleteAllOrganizations()
	}
}
