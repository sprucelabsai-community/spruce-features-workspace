import { SpyDevice } from '@sprucelabs/heartwood-view-controllers'
import { assert, suite, test } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../../tests/AbstractSpruceFixtureTest'

@suite()
export default class ViewFixtureInstanceBasedTest extends AbstractSpruceFixtureTest {
    private static device: SpyDevice

    @test()
    protected async trackDevice() {
        ViewFixtureInstanceBasedTest.device = this.views.getDevice()
    }

    @test()
    protected async isDifferentDeviceForNextTest() {
        assert.isNotEqual(
            ViewFixtureInstanceBasedTest.device,
            this.views.getDevice(),
            'Expected a different device for the next test.'
        )
    }
}
