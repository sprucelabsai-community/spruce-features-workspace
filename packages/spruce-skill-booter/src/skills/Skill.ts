import {
	buildLog,
	HealthCheckResults,
	Log,
	Skill as ISkill,
	SkillFeature,
} from '@sprucelabs/spruce-skill-utils'
import SpruceError from '../errors/SpruceError'

export default class Skill implements ISkill {
	public rootDir
	public activeDir
	public hashSpruceDir

	private featureMap: Record<string, SkillFeature> = {}
	private log: Log
	private _isRunning = false
	private shutdownTimeout: any

	public constructor(options: {
		rootDir: string
		activeDir: string
		hashSpruceDir: string
		log?: Log
	}) {
		this.rootDir = options.rootDir
		this.activeDir = options.activeDir
		this.hashSpruceDir = options.hashSpruceDir
		this.log = options.log ?? buildLog('skill')
	}

	public isFeatureInstalled = async (featureCode: string) => {
		if (!this.featureMap[featureCode]) {
			return false
		}

		return this.featureMap[featureCode].isInstalled()
	}

	public registerFeature = async (
		featureCode: string,
		feature: SkillFeature
	) => {
		this.log.info(`Registering feature.${featureCode}`)
		this.featureMap[featureCode] = feature
	}

	public isRunning(): boolean {
		return this._isRunning
	}

	public async kill() {
		if (this._isRunning) {
			this.log.info('Killing skill')

			this._isRunning = false
			if (this.shutdownTimeout) {
				clearTimeout(this.shutdownTimeout)
			}

			await Promise.all(this.getFeatures().map((feature) => feature.destroy()))

			this.log.info('Kill complete! See you soon. 👋')
		}
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
			await Promise.all(this.getFeatures().map((feature) => feature.execute()))
		} catch (err) {
			this.log.error('Execution error:\n\n' + err.message)
			await this.kill()
			return
		}

		if (!this._isRunning) {
			return
		}

		this.log.info('All features have finished execution.')
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
		await new Promise(
			(resolve) =>
				(this.shutdownTimeout = setTimeout(() => {
					resolve(null)
				}, 1000))
		)

		this._isRunning = false
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
}
