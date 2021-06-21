import AbstractSpruceError from '@sprucelabs/error'
import {
	BuiltViewController,
	BuiltSkillViewController,
	AbstractSkillViewController,
	ViewControllerMap,
} from '@sprucelabs/heartwood-view-controllers'
import { diskUtil, HASH_SPRUCE_DIR_NAME } from '@sprucelabs/spruce-skill-utils'
import SpruceError from '../errors/SpruceError'
import { HealthCheckView } from '../types/view.types'

const viewControllerUtil = {
	loadViewControllers(vcDir: string) {
		const path = require.resolve(
			diskUtil.resolvePath(vcDir, HASH_SPRUCE_DIR_NAME, 'views', 'views')
		)

		if (!diskUtil.doesFileExist(path)) {
			throw new Error(
				`Could not find \`${path}\`. Running \`spruce sync.views\` may help.`
			)
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
	},

	buildControllerMap(vcDir: string) {
		const { vcs, svcs } = this.loadViewControllers(vcDir)
		const map: Partial<ViewControllerMap> = {}

		const all = [...vcs, ...svcs]

		for (const item of all) {
			if (item.Class) {
				//@ts-ignore
				map[item.id] = item.Class
			}
		}

		return map
	},
}

export default viewControllerUtil
