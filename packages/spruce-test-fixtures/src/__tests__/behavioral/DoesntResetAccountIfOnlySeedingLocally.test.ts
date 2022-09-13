import { MercuryTestClient } from '@sprucelabs/mercury-client'
import { coreEventContracts } from '@sprucelabs/mercury-core-events'
import { assert, test } from '@sprucelabs/test-utils'
import { login, seed, StoreFixture } from '../..'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import { DEMO_NUMBER_ACCOUNT_RESET } from '../../tests/constants'
// eslint-disable-next-line spruce/prohibit-import-from-build-folder
import GoodStore from '../testDirsAndFiles/one-good-store-skill/build/stores/Good.store'

let hitCount = 0

MercuryTestClient.reset = () => {}

//@ts-ignore
const emitter = MercuryTestClient.getInternalEmitter(coreEventContracts[0])
void emitter.on('list-organizations::v2020_12_25', () => {
	hitCount++
	return {
		organizations: [],
	}
})

@login(DEMO_NUMBER_ACCOUNT_RESET)
export default class DoesntResetAccountIfOnlySeedingLocally extends AbstractSpruceFixtureTest {
	protected static async beforeEach() {
		await super.beforeEach()
	}

	@test()
	@seed('good', 5)
	protected static doesNotResetAccount() {
		assert.isEqual(hitCount, 1)
	}

	@test()
	@seed('organizations', 1)
	protected static async doesNotResetBefore() {
		assert.isEqual(hitCount, 1)
	}

	@test()
	protected static resetAfterSeedingOrgs() {
		assert.isEqual(hitCount, 2)
	}

	@test()
	protected static shouldNotHaveHit() {
		assert.isEqual(hitCount, 2)
	}
}

StoreFixture.setStore('good', GoodStore)
