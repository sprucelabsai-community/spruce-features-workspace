import {
    CardViewControllerImpl,
    SpyDevice,
    toastAssert,
    ToastMessage,
    ViewControllerId,
} from '@sprucelabs/heartwood-view-controllers'
import { assert, generateId, suite, test } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../../tests/AbstractSpruceFixtureTest'

@suite()
export default class ViewFixtureInstanceBasedTest extends AbstractSpruceFixtureTest {
    private static device: SpyDevice
    private cardVc!: ToastCard

    protected async beforeEach(): Promise<void> {
        await super.beforeEach()
        this.views = this.Fixture('view', {
            controllerMap: {
                'toast-card': ToastCard,
            },
        })

        this.cardVc = this.views.Controller(
            'toast-card' as ViewControllerId,
            {}
        ) as ToastCard
    }

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

    @test()
    protected async canAssertToastIsRendered() {
        await toastAssert.rendersToast(() =>
            this.cardVc.toast({ content: 'Hello world' })
        )
    }

    @test()
    protected async canAssertMatchingToast() {
        const message: ToastMessage = {
            content: generateId(),
        }
        await toastAssert.toastMatches(
            () => this.cardVc.toast(message),
            message
        )
    }
}

class ToastCard extends CardViewControllerImpl {
    public toast(message: ToastMessage) {
        super.toast(message)
    }
}
