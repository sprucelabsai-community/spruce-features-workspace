import { AuthenticatorImpl } from '@sprucelabs/heartwood-view-controllers'
import { assert, test } from '@sprucelabs/test'
import { AbstractSpruceFixtureTest } from '../..'

export default class StoreFixtureTest extends AbstractSpruceFixtureTest {
	@test()
	protected static setsStorageMachanism() {
		debugger
		AuthenticatorImpl.getInstance()
	}
}
