import AbstractSpruceError from '@sprucelabs/error'
import { BuiltSkillViewController } from '@sprucelabs/heartwood-view-controllers'
import {
	diskUtil,
	SettingsService,
	Skill,
	SkillFeature,
} from '@sprucelabs/spruce-skill-utils'
import globby from 'globby'
import SpruceError from '../errors/SpruceError'
import { HealthCheckView, ViewHealthCheckItem } from '../types/view.types'

export class ViewFeature implements SkillFeature {
	private skill: Skill

	public constructor(skill: Skill) {
		this.skill = skill
	}

	public async execute(): Promise<void> {}
	public async checkHealth(): Promise<ViewHealthCheckItem> {
		const { svcs, vcs } = await this.loadViewControllers()

		const errors: AbstractSpruceError[] = []

		const map = (svc: any) => {
			const item: any = {
				id: svc.id,
				file: svc.file,
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
		const search = await globby(['**/*.svc.js', '**/*.vc.js'], {
			cwd: this.skill.activeDir,
		})

		const vcs: ({
			Class: BuiltSkillViewController<any>
		} & HealthCheckView)[] = []
		const svcs: ({
			Class: BuiltSkillViewController
		} & HealthCheckView)[] = []

		for (const file of search) {
			const item: Partial<HealthCheckView & { Class: any }> = { file }
			let c: any
			try {
				c = require(diskUtil.resolvePath(this.skill.activeDir, file)).default
				item.Class = c
				item.id = c.id

				if (!item.id) {
					throw new SpruceError({
						code: 'INVALID_VIEW_CONTROLLER',
						file,
					})
				}
			} catch (err) {
				if (err instanceof AbstractSpruceError) {
					item.error = err
				} else {
					item.error = new SpruceError({
						code: 'UNKNOWN_VIEW_CONTROLLER_ERROR',
						originalError: err,
						file,
					})
				}
			}

			if (file.search('.svc.js') > -1) {
				svcs.push(item)
			} else {
				vcs.push(item)
			}
		}
		return { svcs, vcs }
	}

	public async isInstalled(): Promise<boolean> {
		const settings = new SettingsService(this.skill.rootDir)
		return settings.isMarkedAsInstalled('view')
	}

	public async destroy() {}

	public isBooted() {
		return false
	}
}

export default (skill: Skill) => {
	const feature = new ViewFeature(skill)
	skill.registerFeature('view', feature)
}
