import { test, assert } from '@sprucelabs/test'
import { generateId } from '@sprucelabs/test-utils'
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

	@test()
	protected static async canGetStore() {
		let passedName: any | undefined
		const expected = {
			[generateId()]: generateId(),
		}

		//@ts-ignore
		this.getStoreFixture()!.getStore = async (name) => {
			passedName = name
			return expected
		}

		const name: any = generateId()
		//@ts-ignore
		const actual = await this.getStore(name)

		assert.isEqual(passedName, name)
		assert.isEqualDeep(actual, expected)
	}
}
