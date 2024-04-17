import { Scope, ScopeFlag } from '@sprucelabs/heartwood-view-controllers'
import SpruceError from '../../errors/SpruceError'
import LocationFixture from './LocationFixture'
import OrganizationFixture from './OrganizationFixture'
import {
    doesScopeIncludeOrganization,
    doesScopeIncludeLocation,
} from './scopeUtils'

export default class SpyScope implements Scope {
    public currentOrgId?: string | null
    public currentLocationId?: string | null
    private organizationFixture: OrganizationFixture
    private locationFixture: LocationFixture
    private flags?: ScopeFlag[]
    private shouldThrowOnRequestOutOfScope = true

    public constructor(options: {
        organizationFixture: OrganizationFixture
        locationFixture: LocationFixture
    }) {
        this.organizationFixture = options.organizationFixture
        this.locationFixture = options.locationFixture
    }

    public async getCurrentOrganization() {
        this.assertScopedByOrg()
        if (this.currentOrgId === null) {
            return null
        } else if (this.currentOrgId) {
            return this.organizationFixture.getOrganizationById(
                this.currentOrgId
            )
        } else {
            return this.organizationFixture.getNewestOrganization()
        }
    }

    private assertScopedByOrg() {
        if (
            this.shouldThrowOnRequestOutOfScope &&
            this.flags &&
            !doesScopeIncludeOrganization(this.flags) &&
            !this.isScopedByLocation
        ) {
            throw new SpruceError({
                code: 'INVALID_SCOPE_REQUEST',
                flags: ['none'],
                attemptedToGet: 'organization',
            })
        }
    }

    public setCurrentOrganization(id: string | null) {
        this.currentOrgId = id
        this.currentLocationId = undefined
    }

    public setFlags(flags: ScopeFlag[]) {
        this.flags = flags
    }

    public getFlags(): ScopeFlag[] {
        return this.flags ?? ['none']
    }

    public async getCurrentLocation() {
        this.assertScopedToCurrentLocation()

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

    private assertScopedToCurrentLocation() {
        if (
            this.shouldThrowOnRequestOutOfScope &&
            this.flags &&
            !this.isScopedByLocation
        ) {
            throw new SpruceError({
                code: 'INVALID_SCOPE_REQUEST',
                flags: this.getFlags(),
                attemptedToGet: 'location',
            })
        }
    }

    public setCurrentLocation(id: string | null) {
        this.currentLocationId = id
    }

    public clearSession() {
        this.currentOrgId = undefined
        this.currentLocationId = undefined
    }

    private get isScopedByLocation() {
        const flags = this.flags
        return doesScopeIncludeLocation(flags)
    }

    public disableThrowOnRequestOutOfScope() {
        this.shouldThrowOnRequestOutOfScope = false
    }

    public enableThrowOnRequestOutOfScope() {
        this.shouldThrowOnRequestOutOfScope = true
    }
}
