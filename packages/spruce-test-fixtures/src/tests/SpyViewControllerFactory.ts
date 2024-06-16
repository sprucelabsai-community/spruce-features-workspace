import { ViewControllerFactory } from '@sprucelabs/heartwood-view-controllers'

export default class SpyViewControllerFactory extends ViewControllerFactory {
    public getPlugins() {
        return this.plugins
    }
}
