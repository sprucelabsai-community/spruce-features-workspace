import { Scope } from '@sprucelabs/heartwood-view-controllers'
import LocationFixture from './LocationFixture'
import OrganizationFixture from './OrganizationFixture'

export default class TestScope implements Scope {
	private currentOrgId?: string
	private currentLocationId?: string
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
		if (this.currentOrgId) {
			return this.organizationFixture.getOrganizationById(this.currentOrgId)
		} else {
			return this.organizationFixture.getNewestOrganization()
		}
	}

	public setCurrentOrganization(id: string) {
		this.currentOrgId = id
	}

	public async getCurrentLocation() {
		if (this.currentLocationId) {
			return this.locationFixture.getLocationById(this.currentLocationId)
		} else {
			const org = await this.getCurrentOrganization()
			if (org) {
				return this.locationFixture.getNewestLocation(org.id)
			}
		}

		return null
	}

	public setCurrentLocation(id: string) {
		this.currentLocationId = id
	}

	public clearSession() {
		this.currentOrgId = undefined
		this.currentLocationId = undefined
	}
}
