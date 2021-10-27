import { AuthenticatorImpl } from '@sprucelabs/heartwood-view-controllers'
import { assert, test } from '@sprucelabs/test'
import { AbstractSpruceFixtureTest } from '../..'

export default class StoreFixtureTest extends AbstractSpruceFixtureTest {
	@test()
	protected static async canLogin() {
		const auth = AuthenticatorImpl.getInstance()
		assert.isFalsy(auth.getPerson())

		const { person } = await this.Fixture('view').login(
			process.env.DEMO_NUMBER as string
		)

		const loggedIn = auth.getPerson()

		assert.isTruthy(loggedIn)
		assert.isEqualDeep(loggedIn, person)
	}
}
