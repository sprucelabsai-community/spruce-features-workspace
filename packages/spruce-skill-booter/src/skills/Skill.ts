import {
	buildLog,
	HealthCheckResults,
	Log,
	Skill as ISkill,
	SkillContext,
	SkillFeature,
} from '@sprucelabs/spruce-skill-utils'
import SpruceError from '../errors/SpruceError'

export interface SkillOptions {
	rootDir: string
	activeDir: string
	hashSpruceDir: string
	log?: Log
	shouldCountdownOnExit?: boolean
}

export default class Skill implements ISkill {
	public rootDir
	public activeDir
	public hashSpruceDir

	private featureMap: Record<string, SkillFeature> = {}
	private log: Log
	private _isRunning = false
	private shutdownTimeout: any
	private isKilling = false
	private bootLoggerInterval: any
	private shouldCountdownOnExit = true
	//@ts-ignore
	private context: SkillContext = {}

	public constructor(options: SkillOptions) {
		this.rootDir = options.rootDir
		this.activeDir = options.activeDir
		this.hashSpruceDir = options.hashSpruceDir
		this.log = options.log ?? buildLog('Skill')
		this.shouldCountdownOnExit = options.shouldCountdownOnExit ?? true
	}

	public isFeatureInstalled = async (featureCode: string) => {
		if (!this.featureMap[featureCode]) {
			return false
		}

		return this.featureMap[featureCode].isInstalled()
	}

	public registerFeature = (featureCode: string, feature: SkillFeature) => {
		this.log.info(`Registering feature.${featureCode}`)
		this.featureMap[featureCode] = feature
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
					} catch (err) {
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

	public execute = async () => {
		this._isRunning = true

		try {
			this.bootLoggerInterval = setInterval(() => {
				if (this.isBooted()) {
					clearInterval(this.bootLoggerInterval)
					this.bootLoggerInterval = undefined
					this.log.info('Skill booted!')
				}
			}, 50)

			await Promise.all(this.getFeatures().map((feature) => feature.execute()))
		} catch (err) {
			this.log.error('Execution error:\n\n' + (err.stack ?? err.message))

			await this.kill()

			throw err
		}

		if (this.isKilling || !this._isRunning) {
			return
		}

		if (this.bootLoggerInterval) {
			clearInterval(this.bootLoggerInterval)
			this.log.info('Skill booted!')
		}

		this.log.info('All features have finished execution.')

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

	public async kill() {
		if (this._isRunning && !this.isKilling) {
			this.isKilling = true
			this.log.info('Killing skill')

			if (this.shutdownTimeout) {
				clearTimeout(this.shutdownTimeout)
			}

			if (this.bootLoggerInterval) {
				clearInterval(this.bootLoggerInterval)
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
}
