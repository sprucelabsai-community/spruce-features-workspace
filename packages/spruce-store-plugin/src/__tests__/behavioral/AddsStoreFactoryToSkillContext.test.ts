import { Database, StoreFactory } from '@sprucelabs/data-stores'
import { test, assert } from '@sprucelabs/test-utils'
import AbstractStorePluginTest from '../../tests/AbstractStorePluginTest'

export default class AddsStoreFactoryToSkillContextTest extends AbstractStorePluginTest {
	@test()
	protected static async canCreateAddsStoreFactoryToSkillContext() {
		const context = await this.bootAndGetContext()

		assert.isTruthy(context.storeFactory)
		assert.isEqual(context.storeFactory, context.stores)
		assert.isTruthy(context.database)
	}

	private static async bootAndGetContext() {
		const skill = await this.SkillFromTestDir('one-good-store-skill')

		await this.bootSkill({ skill })

		const context = skill.getContext()
		return context
	}

	@test()
	protected static async storeFactoryIsTyped() {
		const context = await this.bootAndGetContext()
		type Context = typeof context

		assert.isExactType<Context['storeFactory'], StoreFactory>(true)
		assert.isExactType<Context['stores'], StoreFactory>(true)
		assert.isExactType<Context['database'], Database>(true)
	}
}
