import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import MockMessageInterface from '../../../interfaces/MockMessageInterface'

export default class SpyMessageBeforeAndAfterEachTest extends AbstractSpruceTest {
    @test()
    protected static async throwsIfInstantiatingTwoWithoutCallingAfterEach() {
        MockMessageInterface.Ui()
        assert.doesThrow(() => MockMessageInterface.Ui())
        MockMessageInterface.afterEach()
        MockMessageInterface.Ui()
    }

    @test()
    protected static async throwsIfDanglingPrompt() {
        MockMessageInterface.afterEach()
        const ui = MockMessageInterface.Ui()
        void ui.prompt({ type: 'number' })
        ui.renderLine('Hey there!')
        assert.doesThrow(() => MockMessageInterface.afterEach())
    }
}
