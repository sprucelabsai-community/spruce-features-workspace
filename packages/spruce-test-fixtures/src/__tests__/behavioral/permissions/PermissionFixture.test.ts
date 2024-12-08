import {
    Authenticator,
    AuthenticatorEventPayloads,
    AuthenticatorImpl,
    StubStorage,
} from '@sprucelabs/heartwood-view-controllers'
import { Person } from '@sprucelabs/spruce-core-schemas'
import { AuthorizerFactory } from '@sprucelabs/spruce-permission-utils'
import { test, assert } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import fake from '../../../tests/decorators/fake'
import SpyAuthenticator from '../../../tests/fixtures/SpyAuthenticator'

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
        AuthenticatorImpl.reset()
        AuthenticatorImpl.setStorage(new StubStorage())
        AuthenticatorImpl.Class = TempAuthenticator
        const auth = this.getAuthenticator() as TempAuthenticator
        assert.isInstanceOf(auth, TempAuthenticator)
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

class TempAuthenticator implements Authenticator {
    public getPerson(): Person | null {
        return null
    }
    public setSessionToken(_token: string, _person: Person): void {}
    public getSessionToken(): string | null {
        return null
    }
    public isLoggedIn(): boolean {
        return true
    }
    public clearSession(): void {}
    public addEventListener<
        N extends 'did-login' | 'did-logout' | 'will-logout',
    >(_name: N, _cb: AuthenticatorEventPayloads[N]): void {}
}
