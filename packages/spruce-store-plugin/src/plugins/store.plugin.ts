import pathUtil from 'path'
import {
	Database,
	DatabaseFactory,
	StoreFactory,
} from '@sprucelabs/data-stores'
import AbstractSpruceError from '@sprucelabs/error'
import {
	SkillFeature,
	Skill,
	SettingsService,
	namesUtil,
} from '@sprucelabs/spruce-skill-utils'
import globby from 'globby'
import SpruceError from '../errors/SpruceError'
import { StoreLoader } from '../loaders/StoreLoader'
import { StoreHealthCheckItem } from '../types/store.types'

declare module '@sprucelabs/spruce-skill-utils/build/types/skill.types' {
	interface SkillContext {
		storeFactory: StoreFactory
	}
}

export class StoreFeaturePlugin implements SkillFeature {
	private skill: Skill
	private dbConnectionString?: string
	private dbName?: string
	private db?: Promise<Database>
	private storeFactory!: StoreFactory

	public constructor(skill: Skill) {
		this.skill = skill
		this.dbConnectionString = process.env.DB_CONNECTION_STRING
		this.dbName = process.env.DB_NAME
	}

	public async execute(): Promise<void> {
		const { errors, factory } = await this.loadStores()

		if (errors.length > 0) {
			throw errors[0]
		}

		this.storeFactory = factory

		this.skill.updateContext('storeFactory', this.storeFactory)
	}

	public async connectToDatabase() {
		if (!this.db) {
			const missing: string[] = []
			if (!this.dbName) {
				missing.push('env.DB_NAME')
			}

			if (!this.dbConnectionString) {
				missing.push('env.DB_CONNECTION_STRING')
			}

			if (missing.length > 0) {
				throw new SpruceError({
					code: 'MISSING_PARAMETERS',
					parameters: missing,
				})
			}
			const database = DatabaseFactory.Database({
				dbName: this.dbName as string,
				dbConnectionString: this.dbConnectionString as string,
			})

			this.db = database.connect().then(() => database)
		}

		return this.db
	}

	public async checkHealth(): Promise<StoreHealthCheckItem> {
		const { stores, errors } = await this.loadStores()

		const checkItem: StoreHealthCheckItem = {
			status: 'passed',
			stores,
		}

		if (errors.length > 0) {
			checkItem.errors = errors
		}

		return checkItem
	}

	public async loadStores() {
		const db = await this.connectToDatabase()
		const loader = await StoreLoader.Loader(`${this.skill.activeDir}`, db)

		const { factory, errors } = await loader.loadStoresAndErrors()
		const results: StoreHealthCheckItem['stores'] = []
		const loadedStoreNames = factory.getStoreNames()

		for (const name of loadedStoreNames) {
			results.push({
				name: namesUtil.toPascal(name),
				status: 'passed',
			})
		}

		for (const err of errors) {
			results.push({
				name: err.options.name,
				status: 'failed',
				errors: [err],
			})
		}

		results.sort((a, b) => {
			return a.name > b.name ? 1 : -1
		})

		return { stores: results, errors, factory }
	}

	public async isInstalled() {
		const settingsService = new SettingsService(this.skill.rootDir)
		const isInstalled = settingsService.isMarkedAsInstalled('store')

		return isInstalled
	}

	public async destroy(): Promise<void> {}

	public isBooted(): boolean {
		return true
	}

	public getFactory() {
		return this.storeFactory
	}
}

export default (skill: Skill) => {
	const feature = new StoreFeaturePlugin(skill)
	skill.registerFeature('store', feature)
}
