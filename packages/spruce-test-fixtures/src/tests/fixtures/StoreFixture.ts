import {
	StoreFactory,
	StoreLoader,
	StoreMap,
	StoreName,
	StoreOptions,
} from '@sprucelabs/data-stores'

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
}
