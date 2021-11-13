import { Scope } from '@sprucelabs/heartwood-view-controllers'
import LocationFixture from './LocationFixture'
import OrganizationFixture from './OrganizationFixture'

export default class TestScope implements Scope {
	private currentOrg?: string
	private currentLocation?: string
	private organizationFixture: OrganizationFixture
	private locationFixture: LocationFixture

	public constructor(options: {
		organizationFixture: OrganizationFixture
		locationFixture: LocationFixture
	}) {
		this.organizationFixture = options.organizationFixture
		this.locationFixture = options.locationFixture
	}

	public async getCurrentOrganization() {
		if (this.currentOrg) {
			return this.organizationFixture.getOrganizationById(this.currentOrg)
		} else {
			return this.organizationFixture.getNewestOrganization()
		}
	}

	public setCurrentOrganization(id: string) {
		this.currentOrg = id
	}

	public async getCurrentLocation() {
		if (this.currentLocation) {
			return this.locationFixture.getLocationById(this.currentLocation)
		} else {
			const org = await this.getCurrentOrganization()
			if (org) {
				return this.locationFixture.getNewestLocation(org.id)
			}
		}

		return null
	}

	public setCurrentLocation(id: string) {
		this.currentLocation = id
	}
}
