import AbstractSpruceError from '@sprucelabs/error'
import {
	BuiltSkillViewController,
	BuiltViewController,
	ViewControllerExporter,
	AbstractSkillViewController,
} from '@sprucelabs/heartwood-view-controllers'
import { MercuryClient } from '@sprucelabs/mercury-client'
import { EventFeature } from '@sprucelabs/spruce-event-plugin'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import {
	diskUtil,
	SettingsService,
	Skill,
	SkillFeature,
} from '@sprucelabs/spruce-skill-utils'
import SpruceError from '../errors/SpruceError'
import { CoreEventContract } from '../tests/events.contract'
import { HealthCheckView, ViewHealthCheckItem } from '../types/view.types'

export class ViewFeature implements SkillFeature {
	private skill: Skill
	private _isBooted = false

	public constructor(skill: Skill) {
		this.skill = skill
	}

	public async execute(): Promise<void> {
		const viewsPath = this.getCombinedViewsPath()

		if (diskUtil.doesFileExist(viewsPath)) {
			const exporter = ViewControllerExporter.Exporter(this.skill.rootDir)
			const destination = diskUtil.resolvePath(
				diskUtil.createRandomTempDir(),
				'bundle.js'
			)

			await exporter.export({
				source: viewsPath,
				destination,
			})

			const source = diskUtil.readFile(destination)

			const { ids } = await this.loadViewControllers()

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

			eventResponseUtil.getFirstResponseOrThrow(results)
		}

		this._isBooted = true
	}

	private getCombinedBuiltViewsPath() {
		return diskUtil.resolveBuiltHashSprucePath(
			this.skill.rootDir,
			'views',
			'views.js'
		)
	}

	private getCombinedViewsPath() {
		return diskUtil.resolveHashSprucePath(
			this.skill.rootDir,
			'views',
			'views.ts'
		)
	}

	public async checkHealth(): Promise<ViewHealthCheckItem> {
		const { svcs, vcs } = await this.loadViewControllers()

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

	private async loadViewControllers() {
		const path = this.getCombinedBuiltViewsPath()

		if (!diskUtil.doesFileExist(path)) {
			return {
				svcs: [],
				vcs: [],
				ids: [],
			}
		}

		const controllerMap = require(path).default
		const controllers = Object.values(controllerMap) as (
			| (BuiltViewController & { name?: string })
			| (BuiltSkillViewController & { name?: string })
		)[]

		const vcs: ({
			Class?: BuiltViewController
		} & HealthCheckView)[] = []

		const svcs: ({
			Class?: BuiltSkillViewController
		} & HealthCheckView)[] = []

		const ids: string[] = []

		for (const controller of controllers) {
			const item: Partial<HealthCheckView & { Class?: any }> & {
				id: string
			} = {
				Class: controller,
				id: controller.id,
			}
			try {
				if (!item.id) {
					throw new SpruceError({
						code: 'INVALID_VIEW_CONTROLLER',
						id: controller.id,
						name: controller.name,
					})
				}
			} catch (err) {
				if (err instanceof AbstractSpruceError) {
					item.error = err
				} else {
					item.error = new SpruceError({
						code: 'UNKNOWN_VIEW_CONTROLLER_ERROR',
						originalError: err,
						id: controller.id,
						name: controller.name,
					}) as any
				}
			}

			ids.push(item.id)

			//@ts-ignore
			if (controller.prototype instanceof AbstractSkillViewController) {
				svcs.push(item)
			} else {
				vcs.push(item)
			}
		}
		return { svcs, vcs, ids }
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
