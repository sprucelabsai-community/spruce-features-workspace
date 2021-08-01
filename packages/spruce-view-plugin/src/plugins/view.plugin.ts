import AbstractSpruceError from '@sprucelabs/error'
import { ViewControllerExporter } from '@sprucelabs/heartwood-view-controllers'
import { MercuryClient } from '@sprucelabs/mercury-client'
import { EventFeature } from '@sprucelabs/spruce-event-plugin'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import {
	diskUtil,
	Log,
	SettingsService,
	Skill,
	SkillFeature,
} from '@sprucelabs/spruce-skill-utils'
import {
	vcDiskUtil,
	ViewHealthCheckItem,
} from '@sprucelabs/spruce-test-fixtures'
import { CoreEventContract } from '../tests/events.contract'

require('dotenv').config()

export class ViewFeature implements SkillFeature {
	private skill: Skill
	private _isBooted = false
	private log: Log

	public constructor(skill: Skill) {
		this.skill = skill
		this.log = skill.buildLog('View.Feature')
	}

	public async execute(): Promise<void> {
		const viewsPath = this.getCombinedViewsSourcePath()
		if (viewsPath && process.env.SHOULD_REGISTER_VIEWS !== 'false') {
			const results = await this.importAndRegisterSkillViews(viewsPath)
			eventResponseUtil.getFirstResponseOrThrow(results)
		}

		this._isBooted = true
	}

	private async importAndRegisterSkillViews(viewsPath: string) {
		this.log.info('Importing local views.')

		const { ids, theme } = vcDiskUtil.loadViewControllers(this.skill.activeDir)

		const exporter = ViewControllerExporter.Exporter(this.skill.rootDir)
		const destination = diskUtil.resolvePath(
			diskUtil.createRandomTempDir(),
			'bundle.js'
		)

		this.log.info('Bundling local views.')
		const events = this.skill.getFeatureByCode('event') as EventFeature
		const client =
			(await events.connectToApi()) as MercuryClient<CoreEventContract>

		await exporter.export({
			source: viewsPath,
			destination,
		})

		const source = diskUtil.readFile(destination)

		this.log.info(`Bundled ${ids.length} view controllers. Registering now...`)

		const results = await client.emit(
			'heartwood.register-skill-views::v2021_02_11',
			{
				payload: {
					source,
					ids,
					theme,
				},
			}
		)

		this.log.info('Done registering view controllers.')

		return results
	}

	private getCombinedViewsSourcePath() {
		return vcDiskUtil.resolveCombinedViewsPath(
			diskUtil.resolvePath(this.skill.rootDir, 'src')
		)
	}

	public async checkHealth(): Promise<ViewHealthCheckItem> {
		let svcs: any[] = []
		let vcs: any[] = []

		try {
			const loaded = vcDiskUtil.loadViewControllers(this.skill.activeDir, {
				shouldThrowOnError: false,
			})
			svcs = loaded.svcs
			vcs = loaded.vcs
			// eslint-disable-next-line no-empty
		} catch {}

		const errors: AbstractSpruceError[] = []

		const map = (svc: any) => {
			const item: any = {
				id: svc.id,
			}

			if (svc.error) {
				item.error = svc.error
				errors.push(svc.error)
			}

			return item
		}

		const health: ViewHealthCheckItem = {
			status: 'passed',
			skillViewControllers: svcs.map(map),
			viewControllers: vcs.map(map),
		}

		if (errors.length > 0) {
			health.errors = errors
		}

		return health
	}

	public async isInstalled(): Promise<boolean> {
		const settings = new SettingsService(this.skill.rootDir)
		return settings.isMarkedAsInstalled('view')
	}

	public async destroy() {}

	public isBooted() {
		return this._isBooted
	}
}

export default (skill: Skill) => {
	const feature = new ViewFeature(skill)
	skill.registerFeature('view', feature)
}
