import pathUtil from 'path'
import {
	EventContract,
	MercuryEventEmitter,
	SpruceSchemas,
} from '@sprucelabs/mercury-types'
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
	HASH_SPRUCE_DIR_NAME,
	SettingsService,
	diskUtil,
	HealthCheckItem,
	Log,
} from '@sprucelabs/spruce-skill-utils'
import globby from 'globby'
import SpruceError from '../errors/SpruceError'

require('dotenv').config()

type MercuryClient<
	Contract extends EventContract = EventContract
> = MercuryEventEmitter<Contract> & {
	isConnected: () => boolean
	connect: () => Promise<void>
	disconnect: () => Promise<void>
	authenticate(options: {
		skillId?: string
		apiKey?: string
		token?: string
	}): Promise<{
		skill?: SpruceSchemas.Spruce.v2020_07_22.Skill
		person?: SpruceSchemas.Spruce.v2020_07_22.Person
	}>
}

declare module '@sprucelabs/spruce-skill-utils/build/types/skill.types' {
	interface SkillContext {
		mercury: MercuryClient
	}
}

export class EventFeaturePlugin implements SkillFeature {
	private skill: Skill
	private listenersPath: string
	private listeners: EventFeatureListener[] = []
	private eventsIRegistered: Required<NamedEventSignature>[] = []
	private allEventSignatures: NamedEventSignature[] = []
	private combinedContractsFile: string
	private _shouldConnectToApi: boolean
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

	public static shouldClientUseEventContracts(should: boolean) {
		this.shouldPassEventContractsToMercury = should
	}

	public constructor(skill: Skill) {
		this.skill = skill
		this.listenersPath = pathUtil.join(this.skill.activeDir, 'listeners')
		this.combinedContractsFile = pathUtil.join(
			this.skill.activeDir,
			HASH_SPRUCE_DIR_NAME,
			'events',
			'events.contract'
		)

		this._shouldConnectToApi =
			diskUtil.doesFileExist(this.combinedContractsFile + '.ts') ||
			diskUtil.doesFileExist(this.combinedContractsFile + '.js')

		this.log = skill.buildLog('Event.Feature')
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

			await Promise.all([this.reRegisterListeners(), this.reRegisterEvents()])

			if (this.apiClientPromise) {
				this.log.info('Connection to Mercury successful. Waiting for events.')

				const { client } = await this.apiClientPromise
				this.skill.updateContext('mercury', client)

				await new Promise((resolve, reject) => {
					this.executeResolve = resolve
					this.executeReject = reject

					this.isExecuting = false
					this._isBooted = true

					if (didBoot) {
						void this.queueDidBoot(didBoot)
					}
				})
			} else {
				this.log.info(
					"I couldn't find any events or listeners so I won't be connecting to Mercury. 🌲🤖"
				)
				this._isBooted = true
				this.isExecuting = false

				if (didBoot) {
					await this.queueDidBoot(didBoot)
				}
			}
		} catch (err) {
			rej(err)
			this._isBooted = false
			this.isExecuting = false

			throw err
		}
	}

	private async queueDidBoot(didBoot: (event: SpruceEvent) => Promise<void>) {
		try {
			do {
				await new Promise((r) => setTimeout(r, 100))
			} while (!this.skill.isBooted())

			this.log.info(`Emitting skill.didBoot internally.`)

			const event = await this.buildSpruceEvent('did-boot')

			await didBoot(event)
		} catch (err) {
			if (!this.executeReject) {
				throw err
			}
			this.executeReject?.(err)
		}
	}

	private async buildSpruceEvent(
		eventName: string,
		targetAndPayload?: any
	): Promise<SpruceEvent<any, any>> {
		let apiClient: any

		if (this.apiClientPromise) {
			const { client } = await this.apiClientPromise
			apiClient = client
		}

		return {
			skill: this.skill,
			log: this.log.buildLog(eventName),
			...targetAndPayload,
			...this.skill.getContext(),
			mercury: apiClient,
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
		} catch (err) {
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
				this.log.info('Waiting for tear down until main execution completes.')
			}

			while (this.isExecuting) {
				await new Promise((resolve) => setTimeout(resolve, 100))
			}

			if (this.apiClientPromise) {
				const { client } = await this.apiClientPromise

				await client.disconnect()
				this.log.info(`Disconnected from Mercury.`)
			}

			this.apiClientPromise = undefined
		}
	}

	private async loadLocal() {
		await Promise.all([this.loadContracts(), this.loadListeners()])
	}

	public async connectToApi<Contract extends EventContract = any>(options?: {
		shouldWaitForWillBoot?: boolean
	}): Promise<MercuryClient<Contract>> {
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

		const contracts =
			this.shouldConnectToApi() &&
			EventFeaturePlugin.shouldPassEventContractsToMercury
				? require(this.combinedContractsFile).default
				: null

		const MercuryClientFactory = require('@sprucelabs/mercury-client')
			.MercuryClientFactory
		const host = process.env.HOST ?? 'https://sandbox.mercury.spruce.ai'

		this.log.info('Connecting to Mercury at', host)

		this.apiClientPromise = this.connectAndAuthenticate(
			MercuryClientFactory,
			host,
			contracts
		)

		const { client } = await this.apiClientPromise

		return client
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
		host: string,
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
			} catch (err) {
				await client.disconnect()
				this.apiClientPromise = undefined
				throw err
			}
		}
		return { client, currentSkill }
	}

	private async reRegisterListeners() {
		if (!this.shouldConnectToApi()) {
			return
		}

		const client = await this.connectToApi()
		const currentSkill = await this.getCurrentSkill()

		if (client && currentSkill) {
			await client.emit('unregister-listeners::v2020_12_25', {
				payload: {
					shouldUnregisterAll: true,
				},
			})

			this.log.info('Unregistered all existing registered listeners')

			await this.registerListeners(client)
		}
	}

	private async reRegisterEvents() {
		if (!this.shouldConnectToApi()) {
			return
		}

		const client = await this.connectToApi()
		const currentSkill = await this.getCurrentSkill()

		if (client && currentSkill) {
			await client.emit('unregister-events::v2020_12_25', {
				payload: {
					shouldUnregisterAll: true,
				},
			})

			this.log.info('Unregistered existing event contracts')

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
		const client = await this.connectToApi()

		if (this.isDestroyed) {
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
			//@ts-ignore
			contract.eventSignatures[name] = event.signature
		}

		const registerResults = await client.emit('register-events::v2020_12_25', {
			payload: { contract },
		})

		eventResponseUtil.getFirstResponseOrThrow(registerResults)

		this.log.info(
			`Registered ${this.eventsIRegistered.length} event contract${
				this.eventsIRegistered.length === 1 ? '' : 's'
			}`
		)
	}

	private async registerListeners(client: any) {
		for (const listener of this.listeners) {
			if (listener.eventNamespace !== 'skill') {
				const name = eventNameUtil.join({
					eventName: listener.eventName,
					eventNamespace: listener.eventNamespace,
					version: listener.version,
				})

				await client.on(name, async (targetAndPayload: any) => {
					this.log.info(`Incoming event - ${name}`)
					const event = await this.buildSpruceEvent(name, targetAndPayload)
					const results = await listener.callback(event)

					return results
				})

				this.log.info(`Registered listener for ${name}`)
			}
		}
	}

	private async loadContracts() {
		if (this.shouldConnectToApi()) {
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
		return this._shouldConnectToApi
	}

	public async isInstalled() {
		const settingsService = new SettingsService(this.skill.rootDir)
		const isInstalled = settingsService.isMarkedAsInstalled('event')

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

		const listenerMatches = await globby(
			`${this.listenersPath}/**/*.listener.[j|t]s`
		)

		const listeners: EventFeatureListener[] = []

		listenerMatches.forEach((match) => {
			const {
				eventName,
				eventNamespace,
				version,
			} = eventDiskUtil.splitPathToListener(match)

			const callback = require(match).default as
				| EventFeatureListener['callback']
				| undefined

			if (!callback || typeof callback !== 'function') {
				throw new Error(
					`The plugin at ${match} is missing a default export that is a function`
				)
			}

			this.log.info(
				`Found listener for ${eventNameUtil.join({
					eventName,
					eventNamespace,
					version,
				})}`
			)

			listeners.push({
				eventName,
				eventNamespace,
				version,
				callback,
			})
		})

		this.listeners = listeners
	}

	private async loadEvents() {
		if (!this.shouldConnectToApi()) {
			return
		}

		const currentSkill = await this.getCurrentSkill()

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
				`Found ${this.eventsIRegistered.length} events defined locally.`
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
