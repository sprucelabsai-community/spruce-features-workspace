import { MercuryTestClient } from '@sprucelabs/mercury-client'
import { coreEventContracts } from '@sprucelabs/mercury-core-events'
import { assert, test } from '@sprucelabs/test'
import { login, seed, StoreFixture } from '../..'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import { DEMO_NUMBER_ACCOUNT_RESET } from '../../tests/constants'
// eslint-disable-next-line spruce/prohibit-import-from-build-folder
import GoodStore from '../testDirsAndFiles/one-good-store-skill/build/stores/Good.store'

let hitCount = 0

@login(DEMO_NUMBER_ACCOUNT_RESET)
export default class DoesntResetAccountIfOnlySeedingLocally extends AbstractSpruceFixtureTest {
	protected static async beforeEach() {
		await super.beforeEach()
		//@ts-ignore
		const emitter = MercuryTestClient.getInternalEmitter(coreEventContracts[0])
		await emitter.on('list-organizations::v2020_12_25', () => {
			hitCount++
			return {
				organizations: [],
			}
		})
	}

	@test()
	@seed('good', 5)
	protected static doesNotResetAccount() {
		assert.isEqual(hitCount, 0)
	}

	@test()
	@seed('organizations', 1)
	protected static async doesResetWithOrgs() {
		assert.isEqual(hitCount, 0)
	}

	@test()
	protected static shouldHaveHit() {
		assert.isEqual(hitCount, 1)
	}

	@test()
	protected static shouldNotHaveHit() {
		assert.isEqual(hitCount, 1)
	}
}

StoreFixture.setStore('good', GoodStore)
