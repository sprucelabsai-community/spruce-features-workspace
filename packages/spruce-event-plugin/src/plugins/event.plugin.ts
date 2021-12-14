import {
	EventContract,
	MercuryEventEmitter,
	SkillEventContract,
	SpruceSchemas,
} from '@sprucelabs/mercury-types'
import { SchemaError } from '@sprucelabs/schema'
import {
	eventContractUtil,
	eventDiskUtil,
	eventNameUtil,
	eventResponseUtil,
	NamedEventSignature,
	EventHealthCheckItem,
	EventFeatureListener,
	SpruceEvent,
} from '@sprucelabs/spruce-event-utils'
import {
	SkillFeature,
	Skill,
	SettingsService,
	diskUtil,
	HealthCheckItem,
	Log,
	functionDelegationUtil,
	HASH_SPRUCE_DIR_NAME,
} from '@sprucelabs/spruce-skill-utils'
import ListenerCacher from '../cache/ListenerCacher'
import SpruceError from '../errors/SpruceError'

require('dotenv').config()

// so we don't have to require mercury to run this plugin
export type MercuryClient<
	Contract extends SkillEventContract = SkillEventContract
> =
	/** @ts-ignore */
	MercuryEventEmitter<Contract> & {
		isConnected: () => boolean
		connect: () => Promise<void>
		disconnect: () => Promise<void>
		isAuthenticated: () => boolean
		setShouldAutoRegisterListeners: (should: boolean) => void
		getProxyToken: () => string | null
		setProxyToken: (token: string) => void
		registerProxyToken: () => Promise<string>
		getIsTestClient(): boolean
		authenticate(options: {
			skillId?: string
			apiKey?: string
			token?: string
		}): Promise<{
			skill?: SpruceSchemas.Spruce.v2020_07_22.Skill
			person?: SpruceSchemas.Spruce.v2020_07_22.Person
		}>
	}

export class EventFeaturePlugin implements SkillFeature {
	private skill: Skill
	private listenersPath: string | boolean
	private listenerLookup: string
	private listeners: EventFeatureListener[] = []
	private eventsIRegistered: Required<NamedEventSignature>[] = []
	private allEventSignatures: NamedEventSignature[] = []
	private combinedContractsFile?: string
	private _shouldConnectToApi = false

	private apiClientPromise?: Promise<{
		client?: any
		currentSkill?: SpruceSchemas.Spruce.v2020_07_22.Skill
	}>
	private log: Log
	private isDestroyed = false
	private isExecuting = false
	private _isBooted = false
	private executeResolve?: any
	private static shouldPassEventContractsToMercury = true
	private willBootPromise?: Promise<unknown>
	private executeReject?: (reason?: any) => void
	private hasLocalContractBeenUpdated = true
	private haveListenersChaged = true
	private _settings?: SettingsService
	//@ts-ignore
	private listenerCacher?: ListenerCacher // for testing
	private bootHandler?: () => void

	private get settings() {
		if (!this._settings) {
			this._settings = new SettingsService(this.skill.rootDir)
		}

		return this._settings
	}

	public static shouldClientUseEventContracts(should: boolean) {
		this.shouldPassEventContractsToMercury = should
	}

	public constructor(skill: Skill) {
		this.skill = skill

		const resolved = diskUtil.resolvePath(
			this.skill.activeDir,
			HASH_SPRUCE_DIR_NAME,
			'events',
			'listeners'
		)

		const match = diskUtil.resolveFile(resolved)

		this.listenersPath = match
		this.listenerLookup = resolved

		this.log = skill.buildLog('Event.Feature')

		try {
			this.combinedContractsFile =
				eventDiskUtil.resolveCombinedEventsContractFile(this.skill.rootDir)

			this.hasLocalContractBeenUpdated = diskUtil.hasFileChanged(
				this.combinedContractsFile
			)

			this._shouldConnectToApi = true
		} catch {
			this.log.info('Events have not been synced locally.')
			this._shouldConnectToApi = false
		}
	}

	public onBoot(cb: () => void) {
		this.bootHandler = cb
	}

	public async execute() {
		this.isExecuting = true
		let re: any
		let rej: any

		this.willBootPromise = new Promise((resolve, reject) => {
			re = resolve
			rej = reject
		})

		try {
			await this.loadLocal()

			const willBoot = this.getListener('skill', 'will-boot')
			const didBoot = this.getListener('skill', 'did-boot')

			if (willBoot) {
				this.log.info(`Emitting skill.willBoot internally`)

				const event = await this.buildSpruceEvent('will-boot')

				await willBoot(event)
			}

			re()

			await this.loadEvents()

			if (
				!this.hasLocalContractBeenUpdated &&
				process.env.SHOULD_CACHE_EVENT_REGISTRATIONS === 'true'
			) {
				this.log.info(
					'Skipping re-registering events because events.contract has not changed.'
				)
			} else {
				await this.reRegisterEvents()
			}

			await this.registerListeners()

			const done = async () => {
				this.isExecuting = false
				this._isBooted = true

				if (didBoot) {
					await this.queueDidBoot(didBoot)
				} else {
					this.bootHandler?.()
				}
			}

			if (this.apiClientPromise) {
				this.log.info('Connection to Mercury successful. Waiting for events.')

				const { client } = await this.apiClientPromise

				//@ts-ignore
				this.skill.updateContext('mercury', client)

				await new Promise((resolve, reject) => {
					this.executeResolve = resolve
					this.executeReject = reject

					void done()
				})
			} else {
				this.log.info(
					this.isDestroyed
						? 'Aborted setting client to skill context.'
						: "I couldn't find any events or remote listeners so I'll hold off on connecting to Mercury. 🌲🤖"
				)
				await done()
			}
		} catch (err: any) {
			rej(err)
			this._isBooted = false
			this.isExecuting = false

			throw err
		}
	}

	private async queueDidBoot(didBoot: (event: SpruceEvent) => Promise<void>) {
		await new Promise((resolve, reject) => {
			this.skill.onBoot(async () => {
				try {
					this.log.info(`Emitting skill.didBoot internally.`)

					const event = await this.buildSpruceEvent('did-boot')

					await didBoot(event)

					resolve(undefined)
				} catch (err: any) {
					if (!this.executeReject) {
						reject(err)
					} else {
						this.executeReject?.(err)
					}
				}
			})
			this.bootHandler?.()
		})
	}

	private async buildSpruceEvent(
		eventName: string,
		targetAndPayload?: any
	): Promise<SpruceEvent<any, any>> {
		return {
			skill: this.skill,
			log: this.log.buildLog(eventName),
			...targetAndPayload,
			...this.skill.getContext(),
		} as any
	}

	public async checkHealth() {
		try {
			await this.loadEverything()

			const health: EventHealthCheckItem = {
				status: 'passed',
				listeners: this.listeners,
				contracts: this.allEventSignatures.map((contract) => ({
					fullyQualifiedEventName: contract.fullyQualifiedEventName,
				})),
				events: this.eventsIRegistered.map((e) => ({
					eventName: e.eventName,
					eventNamespace: e.eventNamespace,
					version: e.version,
				})),
			}

			await this.destroy()

			return health
		} catch (err: any) {
			const health: HealthCheckItem = {
				status: 'failed',
				errors: [
					new SpruceError({
						//@ts-ignore
						code: 'EVENT_PLUGIN_ERROR',
						originalError: err,
					}).toObject(),
				],
			}

			return health
		}
	}

	private async loadEverything() {
		await Promise.all([this.loadLocal(), this.loadEvents()])
	}

	public async destroy() {
		if (!this.isDestroyed) {
			this.isDestroyed = true

			if (this.executeResolve) {
				this.log.info('Killing execution hold.')
				this.executeResolve()
				this.executeResolve = undefined
			}

			if (this.isExecuting) {
				this.log.info('Waiting to tear down until main execution completes.')
			}

			while (this.isExecuting) {
				await new Promise<void>((resolve) => setTimeout(resolve, 100))
			}

			if (this.apiClientPromise) {
				const { client } = await this.apiClientPromise

				await client.disconnect()

				this.log.info(`Disconnected from Mercury.`)
			}

			this.apiClientPromise = undefined
			this._isBooted = false
		}
	}

	public async reset() {
		this.isDestroyed = false
		this.apiClientPromise = undefined
	}

	private async loadLocal() {
		await Promise.all([this.loadContracts(), this.loadListeners()])
	}

	public async connectToApi(options?: {
		shouldWaitForWillBoot?: boolean
	}): Promise<MercuryClient> {
		if (options?.shouldWaitForWillBoot !== false) {
			await this.willBootPromise
		}

		if (this.isDestroyed) {
			throw new Error(`Can't connect to api when being shut down.`)
		}

		if (this.apiClientPromise) {
			const { client } = await this.apiClientPromise
			return client
		}

		try {
			const contracts =
				this.shouldConnectToApi() &&
				EventFeaturePlugin.shouldPassEventContractsToMercury &&
				this.combinedContractsFile
					? require(this.combinedContractsFile).default
					: null

			const MercuryClientFactory =
				require('@sprucelabs/mercury-client').MercuryClientFactory
			const host = this.getHost()

			if (!host) {
				throw new SchemaError({
					code: 'MISSING_PARAMETERS',
					parameters: ['env.HOST'],
					friendlyMessage: `Stop! I need you to run \`spruce set.remote\` so I know where to connect! Or, you can set HOST in the env directly.`,
				})
			}

			this.log.info('Connecting to Mercury at', host ?? 'Production')

			this.apiClientPromise = this.connectAndAuthenticate(
				MercuryClientFactory,
				host,
				contracts
			)

			const { client } = await this.apiClientPromise

			return client
		} catch (err: any) {
			this.apiClientPromise = undefined
			throw err
		}
	}

	public async getCurrentSkill() {
		await this.connectToApi()

		if (this.apiClientPromise) {
			const { currentSkill } = await this.apiClientPromise

			return currentSkill
		}

		return undefined
	}

	private async connectAndAuthenticate(
		MercuryClientFactory: any,
		host: string | undefined,
		contracts: any
	) {
		const client = await MercuryClientFactory.Client({
			host,
			allowSelfSignedCrt: true,
			contracts,
		})

		this.log.info('Connection successful')

		const skillId = process.env.SKILL_ID
		const apiKey = process.env.SKILL_API_KEY

		let currentSkill: SpruceSchemas.Spruce.v2020_07_22.Skill | undefined

		if (skillId && apiKey) {
			this.log.info('Logging in as skill')

			try {
				const { skill } = await client.authenticate({
					skillId,
					apiKey,
				} as any)

				currentSkill = skill

				this.log.info(`Authenticated as ${currentSkill?.slug}.`)
			} catch (err: any) {
				await client.disconnect()
				this.apiClientPromise = undefined
				throw err
			}
		}
		return { client, currentSkill }
	}

	private async registerListeners() {
		if (!this.shouldConnectToApi()) {
			return
		}

		const client = await this.connectToApi()

		if (this.areListenersCached()) {
			this.log.info(
				'Skipping re-registering of listeners because they have not changed.'
			)
		} else {
			const currentSkill = await this.getCurrentSkill()

			if (client && currentSkill) {
				{
					await client.emit('unregister-listeners::v2020_12_25', {
						payload: {
							shouldUnregisterAll: true,
						},
					})
					this.log.info('Unregistered all existing registered listeners')
				}
			}
		}

		await this.attachListeners(client)
	}

	private areListenersCached() {
		return (
			!this.haveListenersChaged &&
			process.env.SHOULD_CACHE_LISTENER_REGISTRATIONS === 'true'
		)
	}

	private async reRegisterEvents() {
		if (!this.shouldConnectToApi()) {
			return
		}

		const client = await this.connectToApi()
		const currentSkill = await this.getCurrentSkill()

		if (client && currentSkill) {
			await this.registerEvents()
		} else {
			this.log.info(
				`Skipped registering events. ${
					client ? 'I am connected to Mercury' : 'I am not connected to Mercury'
				} ${
					currentSkill
						? 'and have been registered.'
						: 'and have not been registered.'
				}`
			)
		}
	}

	private async registerEvents() {
		debugger
		const client = await this.connectToApi()

		if (this.isDestroyed) {
			return
		}

		if (this.eventsIRegistered.length === 0) {
			this.log.info(
				`I don't have any events to register with Mercury. Skipping event registration.`
			)
			return
		}

		const contract = {
			eventSignatures: {},
		}

		for (const event of this.eventsIRegistered) {
			const name = eventNameUtil.join({
				eventName: event.eventName,
				version: event.version,
			})

			this.log.info(`Found local event named ${name}`)

			//@ts-ignore
			contract.eventSignatures[name] = event.signature
		}

		const registerResults = await client.emit(
			'sync-event-contracts::v2020_12_25',
			{
				payload: { contract },
			}
		)

		eventResponseUtil.getFirstResponseOrThrow(registerResults)

		this.log.info(
			`Registered ${this.eventsIRegistered.length} event signature${
				this.eventsIRegistered.length === 1 ? '' : 's'
			}`
		)
	}

	private async attachListeners(client: any) {
		client.setShouldAutoRegisterListeners(!this.areListenersCached())

		const all = this.listeners.map(async (listener) => {
			if (listener.eventNamespace !== 'skill') {
				const fqen = eventNameUtil.join({
					eventName: listener.eventName,
					eventNamespace: listener.eventNamespace,
					version: listener.version,
				})

				await client.on(fqen, async (targetAndPayload: any) => {
					this.log.info(`Incoming event - ${fqen}`)

					const event = await this.buildSpruceEvent(fqen, targetAndPayload)
					const newClient = {
						//@ts-ignore
						emit: (eventName, tp, cb) => {
							let builtTp = tp

							if (targetAndPayload?.source?.proxyToken) {
								if (!builtTp) {
									builtTp = {}
								}

								builtTp.source = {
									...builtTp?.source,
									proxyToken: targetAndPayload.source.proxyToken,
								}
							}

							return client.emit(eventName, builtTp, cb)
						},
					}

					functionDelegationUtil.delegateFunctionCalls(newClient, event.mercury)
					event.mercury = newClient

					const results = await listener.callback(event)

					return results
				})

				this.log.info(`Listening to ${fqen}`)
			}
		})

		await Promise.all(all)

		client.setShouldAutoRegisterListeners(true)
	}

	private async loadContracts() {
		if (this.shouldConnectToApi() && this.combinedContractsFile) {
			const contracts = require(this.combinedContractsFile).default

			this.log.info(`Loading ${contracts.length} contracts.`)

			contracts.forEach((contract: EventContract) => {
				const named = eventContractUtil.getNamedEventSignatures(contract)

				this.allEventSignatures.push(
					...named.map((named) => ({
						fullyQualifiedEventName: named.fullyQualifiedEventName,
						eventName: named.eventName,
						eventNamespace: named.eventNamespace,
						signature: named.signature,
						version: named.version,
					}))
				)
			})

			return this.allEventSignatures
		}

		return null
	}

	private shouldConnectToApi() {
		return this._shouldConnectToApi && !this.isDestroyed
	}

	public async isInstalled() {
		const isInstalled = this.settings.isMarkedAsInstalled('event')
		return isInstalled
	}

	private getListener(eventNamespace: string, eventName: string) {
		const match = this.listeners.find(
			(listener) =>
				listener.eventNamespace === eventNamespace &&
				listener.eventName === eventName
		)
		if (match) {
			return match.callback
		}

		return undefined
	}

	private async loadListeners() {
		this.log.info('Loading listeners')

		const isInstalled = await this.isInstalled()
		if (!isInstalled && !this.listenersPath) {
			return
		}

		if (!this.listenersPath) {
			throw new SpruceError({
				code: 'EVENT_PLUGIN_ERROR',
				friendlyMessage: `I could not find your listener map at ${this.listenerLookup}. Try generating one with 'spruce sync.events'.`,
			})
		}

		const listeners: EventFeatureListener[] = require(this
			.listenersPath as string).default

		const cacher = new ListenerCacher({
			cwd: this.skill.rootDir,
			listeners,
			host: this.getHost() ?? '***NO HOST SET***',
		})

		this.listenerCacher = cacher //exposed for testing
		this.haveListenersChaged = cacher.haveListenersChanged()

		if (this.haveListenersChaged) {
			cacher.cacheListeners()
		}

		listeners.sort((a, b) => {
			return a.version > b.version ? -1 : 1
		})

		this.listeners = listeners
	}

	private getHost(): string | undefined {
		return process.env.HOST
	}

	public async getNamespace() {
		const pkg = require(this.skill.activeDir + '/../package.json')
		return pkg.skill.namespace
	}

	private async loadEvents() {
		if (!this.shouldConnectToApi()) {
			return
		}

		const currentSkill = await this.getCurrentSkill()

		debugger
		if (currentSkill) {
			this.eventsIRegistered = []

			this.allEventSignatures.forEach((signature) => {
				if (signature.eventNamespace === currentSkill.slug) {
					this.eventsIRegistered.push({
						eventName: signature.eventName,
						eventNamespace: currentSkill.slug,
						version: signature.version ?? '***coming soon***',
						signature: signature.signature,
						fullyQualifiedEventName: signature.fullyQualifiedEventName,
					})
				}
			})

			this.log.info(
				`Found ${this.eventsIRegistered.length} events defined locally for skill slug ${currentSkill.slug}.`
			)
		} else {
			this.log.info(
				'Skipped loading local events beacuse this skill has not been registered. Try `spruce skill.register` first.'
			)
		}

		return this.eventsIRegistered
	}

	public isBooted() {
		return this._isBooted
	}
}

export default (skill: Skill) => {
	const feature = new EventFeaturePlugin(skill)
	skill.registerFeature('event', feature)
}
