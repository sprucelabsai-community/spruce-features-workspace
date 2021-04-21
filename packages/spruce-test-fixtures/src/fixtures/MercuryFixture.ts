import { MercuryClient, MercuryClientFactory } from '@sprucelabs/mercury-client'
import { SkillEventContract } from '@sprucelabs/mercury-types'
const env = require('dotenv')
env.config()

const TEST_HOST = process.env.TEST_HOST ?? 'https://sandbox.mercury.spruce.ai'

export default class MercuryFixture {
	/** @ts-ignore */
	private clientPromise?: Promise<MercuryClient<SkillEventContract>>

	/** @ts-ignore */
	public async connectToApi() {
		if (this.clientPromise) {
			return this.clientPromise
		}

		this.clientPromise = MercuryClientFactory.Client<any>({
			host: TEST_HOST,
			shouldReconnect: false,
			allowSelfSignedCrt:
				TEST_HOST.includes('https://localhost') ||
				TEST_HOST.includes('https://127.0.0.1'),
		})

		return this.clientPromise
	}

	/** @ts-ignore */
	public getApiClientFactory() {
		return this.connectToApi.bind(this)
	}
}
