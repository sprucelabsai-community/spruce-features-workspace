import { MercuryClient, MercuryClientFactory } from '@sprucelabs/mercury-client'
import { coreEventContracts } from '@sprucelabs/mercury-types'
import {
	eventContractUtil,
	eventDiskUtil,
} from '@sprucelabs/spruce-event-utils'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import SpruceError from '../../errors/SpruceError'
const env = require('dotenv')
env.config()

const TEST_HOST = process.env.TEST_HOST ?? process.env.HOST

export default class MercuryFixture {
	private clientPromise?: Promise<MercuryClient>
	private static originalHost: string | undefined
	private cwd: string

	private static shouldAutoImportContracts = true
	private static shouldMixinCoreEventContractWhenImportingLocal = false

	public constructor(cwd: string) {
		this.cwd = cwd
		if (!this.cwd) {
			throw new SpruceError({
				code: 'MISSING_PARAMETERS',
				friendlyMessage: 'Mercury fixture needs cwd.',
				parameters: ['options.cwd'],
			})
		}
	}

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

		this.setDefaultContractToLocalEventsIfExist()

		this.clientPromise = MercuryClientFactory.Client<any>({
			host: TEST_HOST,
			shouldReconnect: false,
			allowSelfSignedCrt:
				TEST_HOST.includes('https://localhost') ||
				TEST_HOST.includes('https://127.0.0.1'),
		})

		return this.clientPromise
	}

	private setDefaultContractToLocalEventsIfExist() {
		if (
			MercuryFixture.shouldAutoImportContracts &&
			diskUtil.doesBuiltHashSprucePathExist(this.cwd)
		) {
			try {
				const combinedContract =
					eventDiskUtil.resolveCombinedEventsContractFile(this.cwd)

				let contracts = require(combinedContract).default

				if (MercuryFixture.shouldMixinCoreEventContractWhenImportingLocal) {
					contracts = [...contracts, ...coreEventContracts]
				}

				const combined = eventContractUtil.unifyContracts(contracts)

				if (combined) {
					MercuryClientFactory.setDefaultContract(combined)
				}
			} catch (err) {
				//since we default to the
				if (err.options?.code === 'EVENT_CONTRACTS_NOT_SYNCED') {
					return
				}

				throw new Error(
					'Mixing in local event contracts failed. Original error:\n\n' +
						err.stack
				)
			}
		}
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
	}

	public static beforeEach() {
		MercuryFixture.shouldAutoImportContracts = true

		if (this.originalHost) {
			process.env.HOST = this.originalHost
		} else {
			delete process.env.HOST
		}

		MercuryClientFactory.resetTestClient()
		MercuryClientFactory.setIsTestMode(true)

		//@ts-ignore
		MercuryClientFactory.setDefaultContract(coreEventContracts[0])
	}

	public static setShouldMixinCoreEventContractsWhenImportingLocal(
		shouldMixin: boolean
	) {
		this.shouldMixinCoreEventContractWhenImportingLocal = shouldMixin
	}

	public static setShouldAutoImportContracts(shouldImport: boolean) {
		MercuryFixture.shouldAutoImportContracts = shouldImport
	}
}
