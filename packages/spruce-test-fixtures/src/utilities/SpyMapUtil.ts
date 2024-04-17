import {
    MapUtil,
    OpenNavigationOptions,
} from '@sprucelabs/heartwood-view-controllers'

export type SpyMapUtil = MapUtil & {
    lastOpenNavigationOptions: OpenNavigationOptions | undefined
}

const spyMapUtil: SpyMapUtil = {
    lastOpenNavigationOptions: undefined,
    openNavigation(options: OpenNavigationOptions): void {
        this.lastOpenNavigationOptions = options
    },
}

export default spyMapUtil
