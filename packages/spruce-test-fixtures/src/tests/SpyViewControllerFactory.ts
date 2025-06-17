import { ViewControllerFactory } from '@sprucelabs/heartwood-view-controllers'

export default class SpyViewControllerFactory extends ViewControllerFactory {
    public getPlugins() {
        return this.plugins
    }

    public getDevice() {
        // @ts-ignore - remove this ignore after 6/20/2025
        return this.device
    }
}
