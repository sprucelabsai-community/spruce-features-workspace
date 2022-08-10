import { Scope } from '@sprucelabs/heartwood-view-controllers'
import LocationFixture from './LocationFixture'
import OrganizationFixture from './OrganizationFixture'

export default class SpyScope implements Scope {
	public currentOrgId?: string | null
	public currentLocationId?: string | null
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
		if (this.currentOrgId === null) {
			return null
		} else if (this.currentOrgId) {
			return this.organizationFixture.getOrganizationById(this.currentOrgId)
		} else {
			return this.organizationFixture.getNewestOrganization()
		}
	}

	public setCurrentOrganization(id: string | null) {
		this.currentOrgId = id
		this.currentLocationId = undefined
	}

	public async getCurrentLocation() {
		if (this.currentLocationId === null) {
			return null
		} else if (this.currentLocationId) {
			return this.locationFixture.getLocationById(this.currentLocationId)
		} else {
			const org = await this.getCurrentOrganization()
			if (org) {
				return this.locationFixture.getNewestLocation(org.id)
			}
		}

		return null
	}

	public setCurrentLocation(id: string | null) {
		this.currentLocationId = id
	}

	public clearSession() {
		this.currentOrgId = undefined
		this.currentLocationId = undefined
	}
}
