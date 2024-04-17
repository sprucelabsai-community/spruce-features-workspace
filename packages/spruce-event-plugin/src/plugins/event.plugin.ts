import { MercuryClient } from '@sprucelabs/mercury-client'
import { EventContract, SpruceSchemas } from '@sprucelabs/mercury-types'
import { SchemaError } from '@sprucelabs/schema'
import {
    eventContractUtil,
    eventDiskUtil,
    eventNameUtil,
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
    HASH_SPRUCE_DIR_NAME,
} from '@sprucelabs/spruce-skill-utils'
import { ClientProxyDecorator } from '@sprucelabs/spruce-test-fixtures'
import ListenerCacher from '../cache/ListenerCacher'
import SpruceError from '../errors/SpruceError'

require('dotenv').config()

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
    private hasLocalContractBeenUpdated = true
    private haveListenersChanged = true
    private _settings?: SettingsService
    //@ts-ignore
    private listenerCacher?: ListenerCacher // for testing
    private bootHandler?: () => void
    protected preRequisites: Promise<unknown>[] = []

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
                eventDiskUtil.resolveCombinedEventsContractFile(
                    this.skill.rootDir
                )

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

        let willBootResolve: any
        let willBootReject: any

        this.willBootPromise = new Promise((resolve, reject) => {
            willBootResolve = resolve
            willBootReject = reject
        })

        try {
            await this.loadLocal()

            const willBoot = this.getListener('skill', 'will-boot')

            if (willBoot) {
                this.log.info(`Emitting skill.will-boot internally`)
                const event = await this.buildSpruceEvent('will-boot')
                await willBoot(event)
            }

            willBootResolve()

            await Promise.all(this.preRequisites ?? [])

            if (this.getShouldRegisterEventsAndListeners()) {
                await this.loadEvents()

                if (
                    !this.hasLocalContractBeenUpdated &&
                    this.getShouldCacheListeners()
                ) {
                    this.log.info(
                        'Skipping re-registering events because events.contract has not changed.'
                    )
                } else {
                    await this.reRegisterEvents()
                }

                await this.registerListeners()
            }

            if (this.apiClientPromise) {
                this.log.info(
                    'Connection to Mercury successful. Waiting for events.'
                )

                const { client } = await this.apiClientPromise

                //@ts-ignore
                this.skill.updateContext('client', client)

                await this.finishExecute()

                await new Promise((resolve) => {
                    this.executeResolve = resolve
                })
            } else {
                this.log.info(
                    this.isDestroyed
                        ? 'Aborted setting client to skill context.'
                        : "I couldn't find any events or remote listeners so I'll hold off on connecting to Mercury. 🌲🤖"
                )

                await this.finishExecute()
            }
        } catch (err: any) {
            willBootReject(err)
            this._isBooted = false
            this.isExecuting = false

            throw err
        }
    }

    private async finishExecute() {
        this.isExecuting = false
        this._isBooted = true
        const didBoot = this.getListener('skill', 'did-boot')

        if (didBoot) {
            await this.queueDidBoot(didBoot)
        } else {
            this.bootHandler?.()
        }
    }

    private getShouldCacheListeners() {
        return process.env.SHOULD_CACHE_EVENT_REGISTRATIONS === 'true'
    }

    private getShouldRegisterEventsAndListeners() {
        return process.env.SHOULD_REGISTER_EVENTS_AND_LISTENERS !== 'false'
    }

    private async queueDidBoot(didBoot: (event: SpruceEvent) => Promise<void>) {
        const promise = new Promise((resolve, reject) => {
            this.skill.onBoot(async () => {
                try {
                    this.log.info(`Emitting skill.did-boot internally.`)

                    const event = await this.buildSpruceEvent('did-boot')

                    await didBoot(event)

                    resolve(undefined)
                } catch (err: any) {
                    reject(err)
                    throw err
                }
            })
        })

        this.bootHandler?.()
        await promise
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
            connectToApiAsSkill: async () => this.connectToApi(),
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
                this.log.info(
                    'Waiting to tear down until main execution completes.'
                )
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
        const retries = process.env.MERCURY_CONNECTION_RETRIES
        const client = await MercuryClientFactory.Client({
            host,
            allowSelfSignedCrt: true,
            contracts,
            connectionRetries: retries ? +retries : 9999,
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

                this.log.info(
                    `Authenticated with namespace: ${currentSkill?.slug}.`
                )
            } catch (err: any) {
                await client.disconnect()
                this.apiClientPromise = undefined
                throw err
            }
        }
        return { client, currentSkill }
    }

    protected async registerListeners() {
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

                    this.log.info(
                        'Unregistered all existing registered listeners'
                    )
                }
            }
        }

        await this.attachListeners(client)
    }

    private areListenersCached() {
        return (
            !this.haveListenersChanged &&
            process.env.SHOULD_CACHE_LISTENER_REGISTRATIONS === 'true'
        )
    }

    protected async reRegisterEvents() {
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
                    client
                        ? 'I am connected to Mercury'
                        : 'I am not connected to Mercury'
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

        await client.emitAndFlattenResponses(
            'sync-event-contracts::v2020_12_25',
            {
                payload: { contract },
            }
        )

        this.log.info(
            `Registered ${this.eventsIRegistered.length} event signature${
                this.eventsIRegistered.length === 1 ? '' : 's'
            }`
        )
    }

    public addPreReq(req: Promise<unknown>) {
        this.preRequisites.push(req)
    }

    private async attachListeners(client: MercuryClient) {
        client.setShouldAutoRegisterListeners(false)

        const remoteListeners = this.listeners
            .filter((l) => l.eventNamespace !== 'skill')
            .map((l) => ({
                ...l,
                fqen: eventNameUtil.join({
                    eventName: l.eventName,
                    eventNamespace: l.eventNamespace,
                    version: l.version,
                }),
            }))

        if (remoteListeners.length > 0 && !this.areListenersCached()) {
            await client.emitAndFlattenResponses(
                'register-listeners::v2020_12_25',
                {
                    payload: {
                        events: remoteListeners.map((l) => ({
                            eventName: l.fqen,
                            isGlobal: !!l.isGlobal,
                        })),
                    },
                }
            )
        }

        const all = remoteListeners.map(async (listener) => {
            const { fqen, callback } = listener

            await client.on(fqen as any, async (targetAndPayload: any) => {
                const now = Date.now()

                this.log.info(`Incoming - ${fqen}`)

                const event = await this.buildSpruceEvent(
                    fqen,
                    targetAndPayload
                )

                const decorator = ClientProxyDecorator.getInstance()

                event.client = decorator.decorateEmitToPassProxyToken(
                    event.client,
                    targetAndPayload?.source?.proxyToken
                )

                try {
                    const results = await callback(event)
                    return results
                } catch (err: any) {
                    this.log.error(
                        `FQEN:`,
                        fqen,
                        err.stack ?? err.message,
                        '\n\n************************************\n\n',
                        JSON.stringify(targetAndPayload),
                        '\n\n************************************\n\n'
                    )
                    throw err
                } finally {
                    this.log.info(`Finished - ${fqen} (${Date.now() - now}ms)`)
                }
            })

            this.log.info(`Listening to ${fqen}`)
        })

        await Promise.all(all)

        client.setShouldAutoRegisterListeners(true)
    }

    private async loadContracts() {
        if (this.shouldConnectToApi() && this.combinedContractsFile) {
            const contracts = require(this.combinedContractsFile).default

            this.log.info(`Loading ${contracts.length} contracts.`)

            contracts.forEach((contract: EventContract) => {
                const named =
                    eventContractUtil.getNamedEventSignatures(contract)

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
                friendlyMessage: `I could not find your listener map at ${this.listenerLookup}. Try generating one with 'spruce sync.listeners'.`,
            })
        }

        const listeners: EventFeatureListener[] = require(
            this.listenersPath as string
        ).default

        const cacher = new ListenerCacher({
            cwd: this.skill.rootDir,
            listeners,
            host: this.getHost() ?? '***NO HOST SET***',
        })

        this.listenerCacher = cacher //exposed for testing
        this.haveListenersChanged = cacher.haveListenersChanged()

        if (this.haveListenersChanged) {
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

    protected async loadEvents() {
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
                        fullyQualifiedEventName:
                            signature.fullyQualifiedEventName,
                    })
                }
            })

            this.log.info(
                `Found ${this.eventsIRegistered.length} events defined locally for skill slug ${currentSkill.slug}.`
            )
        } else {
            this.log.info(
                'Skipped loading local events because this skill has not been registered. Try `spruce skill.register` first.'
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
