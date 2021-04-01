import { test, assert } from '@sprucelabs/test'
import { errorAssertUtil } from '@sprucelabs/test-utils'
import { StoreFeaturePlugin } from '../../plugins/store.plugin'
import AbstractStoreTest from '../../tests/AbstractStoreTest'
import OneGoodStore from '../testDirsAndFiles/one-good-store-skill/src/stores/Good.store'

export default class LoadingStoresOnBootTest extends AbstractStoreTest {
	@test()
	protected static async throwsWhenLoadingImproperlyImplementedStore() {
		this.setCwd('one-bad-store-skill')
		await this.bootSkill()
		assert.isTruthy(this.skillBootError)

		errorAssertUtil.assertError(this.skillBootError, 'FAILED_TO_LOAD_STORE', {
			name: 'Bad',
		})

		this.clearSkillBootErrors()
	}

	@test()
	protected static async throwsIfJustOneStoreIsBad() {
		this.setCwd('one-good-one-bad-store-skill')
		await this.bootSkill()
		assert.isTruthy(this.skillBootError)

		errorAssertUtil.assertError(this.skillBootError, 'FAILED_TO_LOAD_STORE', {
			name: 'Bad',
		})

		this.clearSkillBootErrors()
	}

	@test()
	protected static async throwsIfMissingConnectionString() {
		delete process.env.DB_CONNECTION_STRING

		this.setCwd('one-good-store-skill')
		await this.bootSkill()

		assert.isTruthy(this.skillBootError)

		errorAssertUtil.assertError(this.skillBootError, 'MISSING_PARAMETERS', {
			parameters: ['env.DB_CONNECTION_STRING'],
		})

		this.clearSkillBootErrors()
	}

	@test()
	protected static async throwsIfMissingDbName() {
		delete process.env.DB_NAME

		this.setCwd('one-good-store-skill')
		await this.bootSkill()

		assert.isTruthy(this.skillBootError)

		errorAssertUtil.assertError(this.skillBootError, 'MISSING_PARAMETERS', {
			parameters: ['env.DB_NAME'],
		})

		this.clearSkillBootErrors()
	}

	@test()
	protected static async throwsIfMissingBoth() {
		delete process.env.DB_NAME
		delete process.env.DB_CONNECTION_STRING

		this.setCwd('one-good-store-skill')
		await this.bootSkill()

		assert.isTruthy(this.skillBootError)

		errorAssertUtil.assertError(this.skillBootError, 'MISSING_PARAMETERS', {
			parameters: ['env.DB_NAME', 'env.DB_CONNECTION_STRING'],
		})

		this.clearSkillBootErrors()
	}

	@test()
	protected static async canGetStoreFactory() {
		this.setCwd('one-good-store-skill')
		const skill = await this.bootSkill()
		const stores = skill.getFeatureByCode('store') as StoreFeaturePlugin

		const factory = stores.getFactory()
		assert.isTruthy(factory)
	}

	@test()
	protected static async canGetStoreFromStoreFactory() {
		this.setCwd('one-good-store-skill')
		const skill = await this.bootSkill()
		const stores = skill.getFeatureByCode('store') as StoreFeaturePlugin

		const factory = stores.getFactory()

		//@ts-ignore
		const store = (await factory.Store('good')) as any
		assert.isTruthy(store)
		assert.isTrue(store instanceof OneGoodStore)
	}

	protected static setCwd(key: string) {
		this.cwd = this.resolvePath(
			__dirname,
			'..',
			'..',
			'__tests__',
			'/testDirsAndFiles/',
			key
		)
	}
}
