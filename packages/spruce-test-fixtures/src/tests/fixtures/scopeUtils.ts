import { ScopeFlag } from '@sprucelabs/heartwood-view-controllers'

export function doesScopeIncludeOrganization(flags: ScopeFlag[] | undefined) {
    return flags?.includes('organization')
}
export function doesScopeIncludeLocation(flags: ScopeFlag[] | undefined) {
    return flags?.includes('location')
}
