import { test, assert } from '@sprucelabs/test'
import AbstractStoreTest from '../../tests/AbstractStoreTest'

export default class AbstractStoreTestTest extends AbstractStoreTest {
	@test()
	protected static async factoryShouldBeResetAfterBeforeEach() {
		//@ts-ignore
		await assert.doesThrowAsync(() => this.Store('not-found'))

		//@ts-ignore
		assert.isTruthy(this.storeFixture)

		await this.beforeEach()

		//@ts-ignore
		assert.isFalsy(this.storeFixture)
	}
}
