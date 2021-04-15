import {
	StoreFactory,
	StoreLoader,
	StoreMap,
	StoreName,
} from '@sprucelabs/data-stores'

export default class StoreFixture {
	private loader?: Promise<StoreLoader>
	private stores?: Promise<StoreFactory>

	public async Store<N extends StoreName>(name: N): Promise<StoreMap[N]> {
		if (!this.loader) {
			this.loader = StoreLoader.getInstance()
		}
		const loader = await this.loader

		if (!this.stores) {
			this.stores = loader.loadStores()
		}

		const stores = await this.stores
		return stores.Store(name)
	}
}
