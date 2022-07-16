import {
	Database,
	DatabaseFactory,
	StoreFactory,
	StoreLoader,
} from '@sprucelabs/data-stores'
import { SchemaError } from '@sprucelabs/schema'
import {
	SkillFeature,
	Skill,
	SettingsService,
	namesUtil,
	BootCallback,
} from '@sprucelabs/spruce-skill-utils'
import { StoreHealthCheckItem } from '../types/store.types'

declare module '@sprucelabs/spruce-skill-utils/build/types/skill.types' {
	interface SkillContext {
		/**
		 * @deprecated 'storeFactory' -> 'stores'
		 */
		storeFactory: StoreFactory
		stores: StoreFactory
		database: Database
	}
}

interface DbConnectionOptions {
	dbConnectionString?: string
	dbName?: string
}
export class StoreFeaturePlugin implements SkillFeature {
	private skill: Skill
	private dbConnectionString?: string
	private dbName?: string
	private db?: Promise<Database>
	private storeFactory!: StoreFactory
	private isExecuting = false
	private bootHandler?: BootCallback

	public constructor(skill: Skill) {
		this.skill = skill

		this.dbConnectionString = process.env.DB_CONNECTION_STRING
		this.dbName = process.env.DB_NAME
	}

	public onBoot(cb: BootCallback): void {
		this.bootHandler = cb
	}

	public async execute(): Promise<void> {
		this.isExecuting = true
		try {
			const { errors, factory, db } = await this.loadStores()

			if (errors.length > 0) {
				throw errors[0]
			}

			this.storeFactory = factory

			this.skill.updateContext('storeFactory', this.storeFactory)
			this.skill.updateContext('database', db)

			this.bootHandler?.()
		} finally {
			this.isExecuting = false
		}
	}

	public async checkHealth(): Promise<StoreHealthCheckItem> {
		let isConnected = false

		try {
			await this.connectToDatabase()
			isConnected = true
			// eslint-disable-next-line no-empty
		} catch {}

		const { stores, errors } = await this.loadStores({
			dbConnectionString: 'memory://',
		})

		const checkItem: StoreHealthCheckItem = {
			status: 'passed',
			stores,
			isConnected,
		}

		if (errors.length > 0) {
			checkItem.errors = errors
		}

		return checkItem
	}

	public async connectToDatabase(options?: DbConnectionOptions) {
		if (!this.db) {
			const dbName = options?.dbName ?? this.dbName
			const dbConnectionString =
				options?.dbConnectionString ?? this.dbConnectionString

			const missing: string[] = []
			if (dbConnectionString !== 'memory://' && !dbName) {
				missing.push('env.DB_NAME')
			}

			if (!dbConnectionString) {
				missing.push('env.DB_CONNECTION_STRING')
			}

			if (missing.length > 0) {
				throw new SchemaError({
					code: 'MISSING_PARAMETERS',
					parameters: missing,
				})
			}

			const database = DatabaseFactory.Database({
				dbName: dbName as string,
				dbConnectionString: dbConnectionString as string,
			})

			this.db = database.connect().then(() => database)
		}

		return this.db
	}

	public async loadStores(options?: DbConnectionOptions) {
		const db = await this.connectToDatabase(options)

		const loader = await StoreLoader.getInstance(`${this.skill.activeDir}`, db)

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

		return { stores: results, errors, factory, db }
	}

	public async isInstalled() {
		const settingsService = new SettingsService(this.skill.rootDir)
		const isInstalled = settingsService.isMarkedAsInstalled('store')

		return isInstalled
	}

	public async destroy(): Promise<void> {
		do {
			await new Promise<void>((resolve) => setTimeout(resolve, 100))
		} while (this.isExecuting)

		if (this.db) {
			const db = await this.db
			await db.close()
		}
	}

	public isBooted(): boolean {
		return !this.isExecuting
	}

	public getFactory() {
		return this.storeFactory
	}
}

export default (skill: Skill) => {
	const feature = new StoreFeaturePlugin(skill)
	skill.registerFeature('store', feature)
}
