import { test, assert } from '@sprucelabs/test'
import { errorAssertUtil } from '@sprucelabs/test-utils'
import AbstractStoreTest from '../../tests/AbstractStoreTest'

//@ts-ignore
export default class StoreFeaturePluginTest extends AbstractStoreTest {
	@test()
	protected static async cleanHealthCheckToStart() {
		const health = await this.checkHealth('empty-skill')

		assert.isTruthy(health.store)
		assert.isLength(health.store.stores, 0)
	}

	private static async checkHealth(key: string) {
		const skill = this.Skill(key)
		const health = await skill.checkHealth()

		return health
	}

	protected static Skill(key: string) {
		this.cwd = this.resolvePath(
			__dirname,
			'..',
			'..',
			'__tests__',
			'/testDirsAndFiles/',
			key
		)

		const skill = super.Skill()

		return skill
	}

	@test()
	protected static async returnsAnErrorWithBadStore() {
		const health = await this.checkHealth('one-bad-store-skill')

		assert.isTruthy(health.store)
		assert.isLength(health.store.stores, 1)
		assert.isEqual(health.store.stores[0].name, 'Bad')
		assert.isTruthy(health.store.stores[0].errors)
		errorAssertUtil.assertError(
			health.store.stores[0].errors[0],
			'FAILED_TO_LOAD_STORE',
			{
				name: 'Bad',
			}
		)

		assert.isTruthy(health.store.errors)
		assert.isLength(health.store.errors, 1)

		errorAssertUtil.assertError(
			health.store.errors[0],
			'FAILED_TO_LOAD_STORE',
			{
				name: 'Bad',
			}
		)
	}

	@test()
	protected static async getsGoodStore() {
		const health = await this.checkHealth('one-good-store-skill')

		assert.isTruthy(health.store)
		assert.isFalsy(health.store.errors)
		assert.isEqual(health.store.stores[0].name, 'Good')
	}

	@test()
	protected static async getsOneGoodOneBadStore() {
		const health = await this.checkHealth('one-good-one-bad-store-skill')

		assert.isTruthy(health.store)
		assert.isEqual(health.store.stores[0].name, 'Bad')
		assert.isArray(health.store.stores[0].errors)
		errorAssertUtil.assertError(
			health.store.stores[0].errors[0],
			'FAILED_TO_LOAD_STORE',
			{
				name: 'Bad',
			}
		)
		assert.isEqual(health.store.stores[1].name, 'Good')
	}
}
