import os from 'os'
import {
	buildLog,
	HealthCheckResults,
	Log,
	Skill as ISkill,
	SkillContext,
	SkillFeature,
	pluginUtil,
	LogOptions,
	Level,
	diskUtil,
	BootCallback,
} from '@sprucelabs/spruce-skill-utils'
import SpruceError from '../errors/SpruceError'

export default class Skill implements ISkill {
	public rootDir
	public activeDir
	public hashSpruceDir

	private _featureMap: FeatureMap = {}
	private _log: Log
	private bootHandlers: BootCallback[] = []
	private postBootHandlers: BootCallback[] = []
	private hasInvokedBootHandlers = false
	private get log() {
		return this._log
	}
	private _isRunning = false
	private shutdownTimeout: any
	private isKilling = false
	private shouldCountdownOnExit = true
	//@ts-ignore
	private context: SkillContext = {}

	public constructor(options: SkillOptions) {
		this.rootDir = options.rootDir
		this.activeDir = options.activeDir
		this.hashSpruceDir = options.hashSpruceDir
		this._log = options.log ?? this.buildLogWithTransports()

		this.shouldCountdownOnExit = options.shouldCountdownOnExit ?? true
	}

	public onBoot(cb: BootCallback) {
		this.bootHandlers.push(cb)
	}

	public onPostBoot(cb: BootCallback) {
		this.postBootHandlers.push(cb)
	}

	public isFeatureInstalled = async (featureCode: string) => {
		if (!this.featureMap[featureCode]) {
			return false
		}

		return this.featureMap[featureCode].isInstalled()
	}

	public registerFeature = (featureCode: string, feature: SkillFeature) => {
		this.log.info(`Registering feature.${featureCode}`)
		this._featureMap[featureCode] = feature
	}

	public isRunning(): boolean {
		return this._isRunning
	}

	public checkHealth = async (): Promise<HealthCheckResults> => {
		const results: HealthCheckResults = {
			skill: {
				status: 'passed',
			},
		}

		await Promise.all(
			this.getFeaturesWithCode().map(async (featureWithCode) => {
				const isInstalled = await featureWithCode.feature.isInstalled()
				if (isInstalled) {
					try {
						const item = await featureWithCode.feature.checkHealth()
						//@ts-ignore
						results[featureWithCode.code] = item
					} catch (err: any) {
						//@ts-ignore
						results[featureWithCode.code] = {
							status: 'failed',
							errors: [err],
						}
					}
				}
			})
		)

		return results
	}

	private async done() {
		this.log.info('Skill booted!')
		await this.resolveBootHandlers()
	}

	private async shutDown() {
		if (!this.shouldCountdownOnExit) {
			this.log.info('Shutting down immediately.')
		} else {
			this.log.info('Shutting down in 3')

			await new Promise(
				(resolve) =>
					(this.shutdownTimeout = setTimeout(() => {
						this.log.info('.................2')
						resolve(null)
					}, 1000))
			)
			await new Promise(
				(resolve) =>
					(this.shutdownTimeout = setTimeout(() => {
						this.log.info('.................1')
						resolve(null)
					}, 1000))
			)
			await new Promise(
				(resolve) =>
					(this.shutdownTimeout = setTimeout(() => {
						this.log.info('.................Good bye 👋')
						resolve(null)
					}, 1000))
			)
		}

		this.shutdownTimeout = undefined
		this._isRunning = false
	}

	public execute = async () => {
		this._isRunning = true

		try {
			const features = this.getFeatures()

			if (features.length === 0) {
				await this.done()
			} else {
				let bootCount = 0

				await new Promise((resolve, reject) => {
					for (const feature of features) {
						feature.onBoot(() => {
							bootCount++

							if (bootCount === features.length) {
								void this.done().catch(reject)
							}
						})
					}

					Promise.all(features.map((feature) => feature.execute()))
						.then(resolve)
						.catch(reject)
				})
			}

			await this.shutDown()
		} catch (err: any) {
			this.log.error('Execution error:\n\n' + (err.stack ?? err.message))

			await this.kill()

			throw err
		}

		if (this.isKilling || !this._isRunning) {
			return
		}

		this.log.info('All features have finished execution.')
	}

	private async resolveBootHandlers() {
		if (!this.hasInvokedBootHandlers) {
			this.hasInvokedBootHandlers = true

			for (const handler of this.bootHandlers) {
				await handler()
			}

			for (const handler of this.postBootHandlers) {
				await handler()
			}
		}
	}

	public async kill() {
		if (this._isRunning && !this.isKilling) {
			this.isKilling = true
			this.log.info('Killing skill')

			if (this.shutdownTimeout) {
				clearTimeout(this.shutdownTimeout)
			}

			await Promise.all(this.getFeatures().map((feature) => feature.destroy()))

			this._isRunning = false

			this.log.info('Kill complete. Until next time! 👋')
		}
	}

	public isBooted(): boolean {
		const features = this.getFeatures()
		for (const f of features) {
			if (!f.isBooted()) {
				return false
			}
		}
		return true
	}

	public getFeatures() {
		return Object.values(this.featureMap)
	}

	private getFeaturesWithCode() {
		return Object.keys(this.featureMap).map((code) => ({
			code,
			feature: this.featureMap[code],
		}))
	}

	public getFeatureByCode(code: string): SkillFeature {
		if (this.featureMap[code]) {
			return this.featureMap[code]
		}

		throw new SpruceError({
			code: 'INVALID_FEATURE_CODE',
			suppliedCode: code,
			validCodes: Object.keys(this.featureMap),
		})
	}

	public buildLog(...args: any[]): Log {
		//@ts-ignore
		return this.log.buildLog(...args)
	}

	public getContext() {
		return this.context as SkillContext
	}

	public updateContext<Key extends keyof SkillContext>(
		key: Key,
		value: SkillContext[Key]
	) {
		this.context[key] = value
	}

	private buildLogWithTransports() {
		let transportsByLevel:
			| Partial<LogOptions['transportsByLevel']>
			| undefined = undefined
		const lookupDir = diskUtil.resolvePath(this.activeDir, 'logTransports')

		if (diskUtil.doesDirExist(lookupDir)) {
			const matches = pluginUtil.importSync([], lookupDir)

			if (matches.length > 0) {
				transportsByLevel = {}

				for (const first of matches) {
					if (!first) {
						continue
					}
					if (!Array.isArray(first.levels)) {
						throw new SpruceError({
							//@ts-ignore
							code: 'INVALID_LOG_TRANSPORT',
							friendlyMessage: `The log transport you supplied is invalid. Make sure it exports a function by default and returns an object that looks like:
							
			{ 
				level: string[], 
				transport: (...messageParts: string[]) => void
			}
			`,
						})
					}

					first.levels.forEach((level: Level) => {
						if (transportsByLevel) {
							if (transportsByLevel[level]) {
								throw new SpruceError({
									//@ts-ignore
									code: 'DUPLICATE_LOG_TRANSPORT',
									friendlyMessage: `You have two transports handling '${level}' and that is not supported.`,
								})
							}
							transportsByLevel[level] = first.transport
						}
					})
				}
			}
		}

		return buildLog(`Skill (${os.hostname()} - ${process.pid})`, {
			transportsByLevel,
		})
	}

	private set featureMap(map: FeatureMap) {
		this._featureMap = map
	}
	private get featureMap() {
		if (process.env.ENABLED_SKILL_FEATURES) {
			const features = process.env.ENABLED_SKILL_FEATURES.split(',')
			return features.reduce<FeatureMap>((map, name) => {
				const trimmedName = name.trim()
				const feature = this._featureMap[trimmedName]
				if (feature) {
					map[trimmedName] = feature
				}
				return map
			}, {})
		}
		return this._featureMap
	}
}

export interface SkillOptions {
	rootDir: string
	activeDir: string
	hashSpruceDir: string
	log?: Log
	shouldCountdownOnExit?: boolean
}

export type FeatureMap = Record<string, SkillFeature>
