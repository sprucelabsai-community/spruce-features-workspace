import { test, assert } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import fake from '../../../tests/decorators/fake'

@fake.login()
export default class FakingAuthenticatorTest extends AbstractSpruceFixtureTest {
    @test()
    protected static async canCreateFakingAuthenticator() {
        const auth = this.views.getAuthenticator()
        assert.isEqualDeep(auth.getPerson(), this.fakedPerson)
    }

    @test()
    protected static async setsProperSessionToken() {
        const auth = this.views.getAuthenticator()
        //@ts-ignore
        assert.isEqual(auth.getSessionToken(), this.fakedClient.auth.token)
    }
}
