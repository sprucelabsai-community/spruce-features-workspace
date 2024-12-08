import { AuthenticatorImpl } from '@sprucelabs/heartwood-view-controllers'
import { AuthorizerFactory } from '@sprucelabs/spruce-permission-utils'
import { test, assert } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import fake from '../../../tests/decorators/fake'
import { SpyAuthenticator } from '../../../tests/fixtures/SpyAuthenticator'

@fake.login()
export default class PermissionFixtureTest extends AbstractSpruceFixtureTest {
    @test()
    protected static async disablesPermissionsAtStart() {
        assert.isEqual(process.env.SHOULD_REGISTER_PERMISSIONS, 'false')
    }

    @test()
    protected static async permissionFixtureShouldUseSharedInstance() {
        const actual = this.permissions.getAuthorizer()
        const expected = AuthorizerFactory.getInstance()
        assert.isEqual(actual, expected)
    }

    @test()
    protected static async shouldReturnTestAuthenticator() {
        this.assertAuthenticatorIsSpy()
    }

    @test()
    protected static async shouldBeAbleToOverrideAuthenticatorClass() {
        AuthenticatorImpl.Class = AuthenticatorImpl
        const auth = this.getAuthenticator()
        assert.doesThrow(() => assert.isInstanceOf(auth, SpyAuthenticator))
    }

    @test()
    protected static async authenticatorShouldBeSpyAgain() {
        this.assertAuthenticatorIsSpy()
    }

    private static assertAuthenticatorIsSpy() {
        const auth = this.getAuthenticator()
        assert.isInstanceOf(auth, SpyAuthenticator)
    }

    private static getAuthenticator() {
        return this.permissions.getAuthenticator()
    }
}
