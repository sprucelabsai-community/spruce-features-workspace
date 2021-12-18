import {
	MercuryClient,
	MercuryClientFactory,
	MercuryTestClient,
} from '@sprucelabs/mercury-client'
import { coreEventContracts } from '@sprucelabs/mercury-core-events'
import { SchemaError } from '@sprucelabs/schema'
import {
	eventContractUtil,
	eventDiskUtil,
} from '@sprucelabs/spruce-event-utils'
import { AuthService, diskUtil } from '@sprucelabs/spruce-skill-utils'
import {
	TestConnectFactory,
	TestConnectionOptions,
} from '../../types/fixture.types'
const env = require('dotenv')
env.config()

const TEST_HOST = process.env.TEST_HOST ?? process.env.HOST

export default class MercuryFixture {
	private clientPromises: Promise<MercuryClient>[] = []
	private static originalHost: string | undefined
	private cwd: string

	private static shouldAutoImportContracts = true
	private static shouldMixinCoreEventContractWhenImportingLocal = false
	private static defaultClient?: MercuryClient
	private static shouldAutomaticallyClearDefaultClient = true
	private auth?: AuthService

	public static setDefaultClient(client: MercuryClient) {
		//@ts-ignore
		client.shouldDestroy = this.shouldAutomaticallyClearDefaultClient
		this.defaultClient = client
	}

	public static clearDefaultClient() {
		this.defaultClient = undefined
	}

	public static getDefaultClient(): MercuryClient | undefined {
		return this.defaultClient
	}

	public static setShouldAutomaticallyClearDefaultClient(shouldClear: boolean) {
		this.shouldAutomaticallyClearDefaultClient = shouldClear
	}

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

		try {
			this.auth = AuthService.Auth(this.cwd)
		} catch {
			//@ts-ignore
		}
	}

	public async connectToApi(
		options?: TestConnectionOptions
	): Promise<MercuryClient> {
		const shouldReUseClient = options?.shouldReUseClient !== false
		if (shouldReUseClient && MercuryFixture.defaultClient) {
			return MercuryFixture.optionallyMockAuthenticate(
				MercuryFixture.defaultClient,
				this.auth
			)
		}

		if (shouldReUseClient && this.clientPromises.length > 0) {
			return this.clientPromises[0]
		}

		if (!TEST_HOST) {
			throw new SchemaError({
				code: 'MISSING_PARAMETERS',
				parameters: ['env.HOST'],
				friendlyMessage: `Oops! Before you can do any tests that involve Mercury you need to run \`spruce set.remote\` to point to an environment of your choosing.`,
			})
		}

		MercuryFixture.setDefaultContractToLocalEventsIfExist(this.cwd)

		const promise = MercuryClientFactory.Client<any>({
			host: TEST_HOST,
			shouldReconnect: false,
			allowSelfSignedCrt:
				TEST_HOST.includes('https://localhost') ||
				TEST_HOST.includes('https://127.0.0.1'),
		})

		void promise.then((client) =>
			MercuryFixture.optionallyMockAuthenticate(client, this.auth)
		)

		this.clientPromises.push(promise)

		return promise
	}

	private static async optionallyMockAuthenticate<
		C extends MercuryClient | undefined
	>(client?: C, auth?: AuthService): Promise<C> {
		const currentSkill = auth?.getCurrentSkill()

		if (currentSkill) {
			const emitter = MercuryTestClient.getInternalEmitter({
				eventSignatures: {
					'authenticate::v2020_12_25': {},
				},
			})

			await emitter.off('authenticate::v2020_12_25')

			client?.setShouldAutoRegisterListeners(false)

			await emitter.on('authenticate::v2020_12_25', async () => {
				return {
					type: 'authenticated' as any,
					auth: {
						skill: {
							creators: [{}],
							dateCreated: 0,
							...currentSkill,
							name: currentSkill.name ?? 'Current skill',
						},
					},
				}
			})
		}

		return client as any
	}

	public static setDefaultContractToLocalEventsIfExist(cwd: string) {
		if (
			MercuryFixture.shouldAutoImportContracts &&
			diskUtil.doesBuiltHashSprucePathExist(cwd)
		) {
			try {
				const combinedContract =
					eventDiskUtil.resolveCombinedEventsContractFile(cwd)

				let contracts = require(combinedContract).default

				if (MercuryFixture.shouldMixinCoreEventContractWhenImportingLocal) {
					contracts = [...contracts, ...coreEventContracts]
				}

				const combined = eventContractUtil.unifyContracts(contracts)

				if (combined) {
					MercuryFixture.setDefaultContract(combined)
				}
			} catch (err: any) {
				//since we default to the
				if (err.options?.code === 'EVENT_CONTRACTS_NOT_SYNCED') {
					MercuryFixture.setDefaultContract(coreEventContracts[0])
					return
				}

				throw new Error(
					'Mixing in local event contracts failed. Original error:\n\n' +
						err.stack
				)
			}
		} else {
			MercuryFixture.setDefaultContract(coreEventContracts[0])
		}
	}

	private static setDefaultContract(contract: any) {
		//@ts-ignore
		MercuryClientFactory.setDefaultContract(contract)
		//@ts-ignore
		MercuryTestClient.emitter?.mixinOnlyUniqueSignatures(contract)
	}

	public getConnectFactory() {
		return this.connectToApi as TestConnectFactory
	}

	public async destroy() {
		for (const clientPromise of this.clientPromises) {
			const client = await clientPromise
			//@ts-ignore
			if (client.shouldDestroy !== false) {
				await client.disconnect()
			}
		}

		this.clientPromises = []
	}

	public static beforeAll() {
		this.originalHost = process.env.TEST_HOST ?? process.env.HOST ?? TEST_HOST
	}

	public static async beforeEach(cwd: string) {
		if (this.originalHost) {
			process.env.HOST = this.originalHost
		} else {
			delete process.env.HOST
		}

		MercuryClientFactory.reset()
		MercuryClientFactory.setIsTestMode(true)

		if (this.shouldAutomaticallyClearDefaultClient) {
			this.clearDefaultClient()
		}

		this.setDefaultContractToLocalEventsIfExist(cwd)

		try {
			const auth = AuthService.Auth(cwd)
			await this.optionallyMockAuthenticate(undefined, auth)
			// eslint-disable-next-line no-empty
		} catch {}
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
