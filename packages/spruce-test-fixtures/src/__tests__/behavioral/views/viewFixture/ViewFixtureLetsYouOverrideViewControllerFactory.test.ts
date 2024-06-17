import { ViewControllerFactory } from '@sprucelabs/heartwood-view-controllers'
import { test, assert } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../../tests/AbstractSpruceFixtureTest'

export default class ViewFixtureLetsYouOverrideViewControllerFactoryTest extends AbstractSpruceFixtureTest {
    protected static async beforeEach() {
        await super.beforeEach()
    }

    @test()
    protected static async canCreateViewFixtureLetsYouOverrideViewControllerFactory() {
        assert.isEqual(ViewControllerFactory.Class, MySpyViewControllerFactory)
    }
}

class MySpyViewControllerFactory extends ViewControllerFactory {}
ViewControllerFactory.Class = MySpyViewControllerFactory
