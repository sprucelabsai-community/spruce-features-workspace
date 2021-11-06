import { MercuryClient, MercuryClientFactory } from '@sprucelabs/mercury-client'
import { coreEventContracts } from '@sprucelabs/mercury-core-events'
import { SchemaError } from '@sprucelabs/schema'
import {
	eventContractUtil,
	eventDiskUtil,
} from '@sprucelabs/spruce-event-utils'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'
const env = require('dotenv')
env.config()

export interface ApiClientFactoryOptions {
	shouldReUseClient?: boolean
}

const TEST_HOST = process.env.TEST_HOST ?? process.env.HOST

export default class MercuryFixture {
	private clientPromises: Promise<MercuryClient>[] = []
	private static originalHost: string | undefined
	private cwd: string

	private static shouldAutoImportContracts = true
	private static shouldMixinCoreEventContractWhenImportingLocal = false

	public constructor(cwd: string) {
		this.cwd = cwd
		if (!this.cwd) {
			throw new SchemaError({
				code: 'MISSING_PARAMETERS',
				friendlyMessage: 'Mercury fixture needs cwd.',
				parameters: ['options.cwd'],
			})
		}

		this.connectToApi = this.connectToApi.bind(this)
	}

	public async connectToApi(
		options?: ApiClientFactoryOptions
	): Promise<MercuryClient> {
		if (
			options?.shouldReUseClient !== false &&
			this.clientPromises.length > 0
		) {
			return this.clientPromises[0]
		}

		if (!TEST_HOST) {
			throw new SchemaError({
				code: 'MISSING_PARAMETERS',
				parameters: ['env.HOST'],
				friendlyMessage: `Oops! Before you can do any tests that involve Mercury you need to run \`spruce set.remote\` to point to an environment of your choosing.`,
			})
		}

		this.setDefaultContractToLocalEventsIfExist()

		const promise = MercuryClientFactory.Client<any>({
			host: TEST_HOST,
			shouldReconnect: false,
			allowSelfSignedCrt:
				TEST_HOST.includes('https://localhost') ||
				TEST_HOST.includes('https://127.0.0.1'),
		})

		this.clientPromises.push(promise)

		return promise
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
			} catch (err: any) {
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
		return this.connectToApi
	}

	public async destroy() {
		for (const clientPromise of this.clientPromises) {
			const client = await clientPromise
			await client.disconnect()
		}

		this.clientPromises = []
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
