import { assert, test } from '@sprucelabs/test-utils'
import { AbstractSpruceFixtureTest, login, seed } from '../..'
import { DEMO_NUMBER_TEST_CLIENT_RECENT } from '../../tests/constants'

@login(DEMO_NUMBER_TEST_CLIENT_RECENT)
export class ResettingLocalEventListeningBeforeSeedingTest extends AbstractSpruceFixtureTest {
	private static hitCount = 0

	@seed('organizations', 1)
	protected static async beforeEach(): Promise<void> {
		await super.beforeEach()
	}

	@test()
	protected static async testClientIsResetBeforeSeeding() {
		await login.getClient().on('create-organization::v2020_12_25', () => {
			this.hitCount++
			return {
				organization: {} as any,
			}
		})
	}

	@test()
	protected static async hitCountShouldBeZero() {
		assert.isEqual(this.hitCount, 0)
	}
}
