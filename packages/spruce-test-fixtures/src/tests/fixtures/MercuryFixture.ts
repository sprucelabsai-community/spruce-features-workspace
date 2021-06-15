import { MercuryClient, MercuryClientFactory } from '@sprucelabs/mercury-client'
import { coreEventContracts } from '@sprucelabs/mercury-types'
import SpruceError from '../../errors/SpruceError'
const env = require('dotenv')
env.config()

const TEST_HOST = process.env.TEST_HOST ?? process.env.HOST

export default class MercuryFixture {
	private clientPromise?: Promise<MercuryClient>
	private static originalHost: string | undefined

	/** @ts-ignore */
	public async connectToApi() {
		if (this.clientPromise) {
			return this.clientPromise
		}

		if (!TEST_HOST) {
			throw new SpruceError({
				code: 'MISSING_PARAMETERS',
				parameters: ['env.HOST'],
				friendlyMessage: `Oops! Before you can do any tests that involve Mercury you need to run \`spruce set.remote\` to point to an environment of your choosing.`,
			})
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

	public async destroy() {
		if (this.clientPromise) {
			const client = await this.clientPromise
			await client.disconnect()
			this.clientPromise = undefined
		}
	}

	public static beforeAll() {
		this.originalHost = process.env.TEST_HOST ?? process.env.HOST ?? TEST_HOST

		MercuryClientFactory.setIsTestMode(true)
		//@ts-ignore
		MercuryClientFactory.setDefaultContract(coreEventContracts[0])
	}

	public static beforeEach() {
		if (this.originalHost) {
			process.env.HOST = this.originalHost
		} else {
			delete process.env.HOST
		}

		MercuryClientFactory.resetTestClient()
	}
}
