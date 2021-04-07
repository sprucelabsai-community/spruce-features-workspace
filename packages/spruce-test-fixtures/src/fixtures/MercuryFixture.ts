import { MercuryClient, MercuryClientFactory } from '@sprucelabs/mercury-client'
import { SkillEventContract } from '@sprucelabs/mercury-types'

export default class MercuryFixture {
	/** @ts-ignore */
	private clientPromise?: Promise<MercuryClient<SkillEventContract>>

	/** @ts-ignore */
	public async connectToApi() {
		if (this.clientPromise) {
			return this.clientPromise
		}
		this.clientPromise = MercuryClientFactory.Client<any>({
			host: 'https://sandbox.mercury.spruce.ai',
		})

		return this.clientPromise
	}

	/** @ts-ignore */
	public getApiClientFactory() {
		return this.connectToApi.bind(this)
	}
}
