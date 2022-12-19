import { AuthenticatorImpl } from '@sprucelabs/heartwood-view-controllers'
import { AuthorizerFactory } from '@sprucelabs/spruce-permission-utils'
import { TestConnectFactory } from '../../types/fixture.types'
import FakeAuthorizer from '../FakeAuthorizer'
import MercuryFixture from './MercuryFixture'

export default class PermissionFixture {
	private connectToApi: TestConnectFactory

	public constructor(mercury: MercuryFixture) {
		this.connectToApi = mercury.getConnectFactory()
		AuthorizerFactory.setConnectToApi(this.connectToApi)
	}

	public static beforeEach() {
		process.env.SHOULD_REGISTER_PERMISSIONS = 'false'
		AuthorizerFactory.reset()
		AuthorizerFactory.setClass(FakeAuthorizer)
	}

	public getAuthorizer(): FakeAuthorizer {
		return AuthorizerFactory.getInstance() as FakeAuthorizer
	}

	public getAuthenticator() {
		return AuthenticatorImpl.getInstance()
	}
}
