import { test, assert } from '@sprucelabs/test'
import AbstractStoreTest from '../../tests/AbstractStoreTest'

export default class GracefullyExitingOnErrorsTest extends AbstractStoreTest {
	protected static async beforeEach() {
		await super.beforeEach()
		this.cwd = this.resolvePath(
			__dirname,
			'..',
			'testDirsAndFiles',
			'empty-skill'
		)
	}

	@test()
	protected static async skillIsKilledOnDidBootError() {
		const skill = this.Skill()

		void skill.registerFeature('test', {
			execute: async () => {
				throw new Error('crash!')
			},
			checkHealth: async () => ({ status: 'passed' }),
			isInstalled: async () => true,
			isBooted: () => false,
			destroy: async () => {},
		})

		await assert.doesThrowAsync(() => skill.execute())
	}

	@test()
	protected static async shutsDownWithDatabaseError() {
		process.env.DB_CONNECTION_STRING = 'wakawaka'
		process.env.DB_NAME = 'wakawaka'
		const skill = this.Skill()

		await assert.doesThrowAsync(() => skill.execute())
	}

	@test()
	protected static async shutsDownWithBadStore() {
		this.cwd = this.resolvePath(
			__dirname,
			'..',
			'testDirsAndFiles',
			'one-bad-store-skill'
		)

		const skill = this.Skill()

		await assert.doesThrowAsync(() => skill.execute())
	}
}
