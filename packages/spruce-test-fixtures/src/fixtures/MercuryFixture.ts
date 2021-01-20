import { MercuryClient, MercuryClientFactory } from '@sprucelabs/mercury-client'

export default class MercuryFixture {
	private clientPromise?: Promise<MercuryClient<any>>

	public async connectToApi() {
		if (this.clientPromise) {
			return this.clientPromise
		}
		this.clientPromise = MercuryClientFactory.Client<any>({
			host: 'https://sandbox.mercury.spruce.ai',
		})

		return this.clientPromise
	}

	public getApiClientFactory() {
		return this.connectToApi.bind(this)
	}
}
