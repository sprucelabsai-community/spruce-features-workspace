import { Scope } from '@sprucelabs/heartwood-view-controllers'
import { assert, test } from '@sprucelabs/test'
import { AbstractSpruceFixtureTest, login, seed } from '../..'
import { DEMO_NUMBER_SCOPE } from '../../tests/constants'

@login(DEMO_NUMBER_SCOPE)
export default class TestingScopeTest extends AbstractSpruceFixtureTest {
	private static scope: Scope
	protected static async beforeEach() {
		await super.beforeEach()
		this.scope = this.views.getScope()
	}
	@test()
	protected static async canResetScope() {
		await this.seeder.resetAccount()

		this.scope.setCurrentLocation('aoeu')
		this.scope.setCurrentOrganization('aoeu')

		this.scope.clearSession()

		const location = await this.scope.getCurrentLocation()

		assert.isFalsy(location)
	}

	@test()
	@seed('organizations', 1)
	protected static async canSetCurrentOrgToNull() {
		this.scope.setCurrentOrganization(null)
		const org = await this.scope.getCurrentOrganization()
		assert.isNull(org)
	}

	@test()
	@seed('organizations', 1)
	@seed('locations', 1)
	protected static async canSetCurrentLocationToNull() {
		this.scope.setCurrentLocation(null)
		const org = await this.organizations.getNewestOrganization()
		assert.isTruthy(org)

		const location = await this.scope.getCurrentLocation()
		assert.isNull(location)
	}
}
