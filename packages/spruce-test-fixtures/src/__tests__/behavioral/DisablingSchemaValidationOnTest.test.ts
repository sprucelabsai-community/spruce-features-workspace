import { test, assert } from '@sprucelabs/test-utils'
import { AbstractSpruceFixtureTest } from '../..'

export default class DisablingSchemaValidationOnTestTest extends AbstractSpruceFixtureTest {
    @test()
    protected static shouldValidateIsFalse() {
        assert.isEqual(process.env.SHOULD_VALIDATE_SCHEMAS_ON_BOOT, 'false')
        process.env.SHOULD_VALIDATE_SCHEMAS_ON_BOOT = 'true'
    }

    @test()
    protected static revertsBeforeEachTest() {
        assert.isEqual(process.env.SHOULD_VALIDATE_SCHEMAS_ON_BOOT, 'false')
    }
}
