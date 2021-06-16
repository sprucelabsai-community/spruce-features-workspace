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
import { CoreEventContract } from '../tests/events.contract'
import { ViewHealthCheckItem } from '../types/view.types'
import viewControllerUtil from '../utilities/viewController.utility'

export class ViewFeature implements SkillFeature {
	private skill: Skill
	private _isBooted = false
	private log: Log

	public constructor(skill: Skill) {
		this.skill = skill
		this.log = skill.buildLog('View.Feature')
	}

	public async execute(): Promise<void> {
		const viewsPath = this.getCombinedViewsPath()

		if (diskUtil.doesFileExist(viewsPath)) {
			this.log.info('Importing local views.')

			const exporter = ViewControllerExporter.Exporter(this.skill.rootDir)
			const destination = diskUtil.resolvePath(
				diskUtil.createRandomTempDir(),
				'bundle.js'
			)

			this.log.info('Bundling local views.')
			await exporter.export({
				source: viewsPath,
				destination,
			})

			const source = diskUtil.readFile(destination)

			const { ids } = viewControllerUtil.loadViewControllers(
				this.skill.activeDir
			)

			this.log.info(
				`Bundled ${ids.length} view controllers. Registering now...`
			)

			const events = this.skill.getFeatureByCode('event') as EventFeature
			const client =
				(await events.connectToApi()) as MercuryClient<CoreEventContract>

			const results = await client.emit(
				'heartwood.register-skill-views::v2021_02_11',
				{
					payload: {
						source,
						ids,
					},
				}
			)

			this.log.info('Done registering view controllers.')
			eventResponseUtil.getFirstResponseOrThrow(results)
		}

		this._isBooted = true
	}

	private getCombinedViewsPath() {
		return diskUtil.resolveHashSprucePath(
			this.skill.rootDir,
			'views',
			'views.ts'
		)
	}

	public async checkHealth(): Promise<ViewHealthCheckItem> {
		let svcs: any[] = []
		let vcs: any[] = []

		try {
			const loaded = viewControllerUtil.loadViewControllers(
				this.skill.activeDir
			)
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
