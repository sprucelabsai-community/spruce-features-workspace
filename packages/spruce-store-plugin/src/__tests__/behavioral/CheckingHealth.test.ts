import { test, assert } from '@sprucelabs/test'
import { errorAssertUtil } from '@sprucelabs/test-utils'
import AbstractStoreTest from '../../tests/AbstractStoreTest'

export default class StoreFeaturePluginTest extends AbstractStoreTest {
	protected static async beforeEach() {
		await super.beforeEach()
		//@ts-ignore
		jest.resetModules()
	}

	@test('clean health with env', true)
	@test('clean health without env', false)
	protected static async cleanHealthCheckToStart(shouldSetEnv: boolean) {
		this.setEnv(shouldSetEnv)

		const health = await this.checkHealth('empty-skill')

		assert.isTruthy(health.store)
		assert.isEqual(health.store.isConnected, shouldSetEnv)
		assert.isLength(health.store.stores, 0)
	}

	private static async checkHealth(key: string) {
		const skill = await this.SkillFromTestDir(key)
		const health = await skill.checkHealth()

		return health
	}

	@test('returns error with bad store with env', true)
	@test('returns error with bad store without env', false)
	protected static async returnsAnErrorWithBadStore(shouldSetEnv: boolean) {
		this.setEnv(shouldSetEnv)

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

	@test('gets good store with env', true)
	@test('gets good store without env', false)
	protected static async getsGoodStore(shouldSetEnv: boolean) {
		this.setEnv(shouldSetEnv)

		const health = await this.checkHealth('one-good-store-skill')

		assert.isTruthy(health.store)
		assert.isFalsy(health.store.errors)
		assert.isEqual(health.store.stores[0].name, 'Good')
	}

	@test('gets one good and one bad store with env', true)
	@test('gets one good and one bad store without env', false)
	protected static async getsOneGoodOneBadStore(shouldSetEnv: boolean) {
		this.setEnv(shouldSetEnv)

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

	private static setEnv(shouldSetEnv: boolean) {
		if (!shouldSetEnv) {
			delete process.env.DB_CONNECTION_STRING
			delete process.env.DB_NAME
		} else {
			process.env.DB_CONNECTION_STRING = 'memory://'
			process.env.DB_NAME = 'memory'
		}
	}
}
