import { assert, test } from '@sprucelabs/test'
import { AbstractSpruceFixtureTest, login } from '../..'
import { DEMO_NUMBER_SCOPE } from '../../tests/constants'

@login(DEMO_NUMBER_SCOPE)
export default class TestingScopeTest extends AbstractSpruceFixtureTest {
	@test()
	protected static async canResetScope() {
		await this.Fixture('seed').resetAccount()
		const scope = this.Fixture('view').getScope()

		scope.setCurrentLocation('aoeu')
		scope.setCurrentOrganization('aoeu')

		scope.clearSession()

		const location = await scope.getCurrentLocation()

		assert.isFalsy(location)
	}
}
