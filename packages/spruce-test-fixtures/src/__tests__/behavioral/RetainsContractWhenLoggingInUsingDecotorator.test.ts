import { MercuryClient } from '@sprucelabs/mercury-client'
import { test } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import { DEMO_NUMBER_ACCOUNT_RESET } from '../../tests/constants'
import login from '../../tests/decorators/login'
import MercuryFixture from '../../tests/fixtures/MercuryFixture'
import StoreFixture from '../../tests/fixtures/StoreFixture'
// eslint-disable-next-line spruce/prohibit-import-from-build-folder
import GoodStore from '../testDirsAndFiles/one-good-store-skill/build/stores/Good.store'

MercuryFixture.setShouldRequireLocalListeners(false)

@login(DEMO_NUMBER_ACCOUNT_RESET)
export default class RetainsContractWhenLoggingInUsingDecorator extends AbstractSpruceFixtureTest {
	private static client: MercuryClient
	protected static async beforeEach() {
		await super.beforeEach()
		this.client = login.getClient()
	}

	@test()
	protected static async clientStillHasContract() {
		await this.client.on('whoami::v2020_12_25', () => ({
			auth: {},
			type: 'authenticated' as const,
		}))
	}
}

StoreFixture.setStore('good', GoodStore)
