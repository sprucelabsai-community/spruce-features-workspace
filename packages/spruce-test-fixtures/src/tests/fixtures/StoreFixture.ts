import {
	DatabaseFixture,
	StoreFactory,
	StoreLoader,
	StoreMap,
	StoreName,
	StoreOptions,
} from '@sprucelabs/data-stores'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'

export default class StoreFixture {
	private storeFactory?: Promise<StoreFactory>
	private loader?: Promise<StoreLoader>
	private stores?: Promise<StoreFactory>

	public async Store<N extends StoreName, O extends StoreOptions<N>>(
		name: N,
		options?: O
	): Promise<StoreMap[N]> {
		const factory = await this.getStoreFactory()
		return factory.Store(name, options)
	}

	public async getStoreFactory() {
		if (!this.stores) {
			if (!this.loader) {
				this.loader = StoreLoader.getInstance()
				await this.loader
			}
			const loader = await this.loader

			this.storeFactory = loader.loadStores()
		}

		const factory = await this.storeFactory
		return factory as StoreFactory
	}

	public static async beforeAll() {
		const cwd = diskUtil.resolvePath(process.cwd(), 'build')

		StoreLoader.setStoreDir(cwd)

		DatabaseFixture.beforeAll()
	}

	public static async beforeEach() {
		process.env.DB_NAME = 'memory'
		process.env.DB_CONNECTION_STRING = 'memory://'

		await DatabaseFixture.destroy()

		const db = await new DatabaseFixture().connectToDatabase()

		StoreLoader.clearInstance()
		StoreLoader.setDatabase(db)
	}

	public static DatabaseFixture() {
		return new DatabaseFixture()
	}
}
