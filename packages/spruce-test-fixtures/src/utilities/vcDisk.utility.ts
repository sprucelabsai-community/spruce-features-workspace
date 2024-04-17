import AbstractSpruceError from '@sprucelabs/error'
import {
    ViewController,
    SkillViewController,
    AbstractSkillViewController,
    ViewControllerMap,
    SpruceSchemas,
    ViewControllerPluginsByName,
} from '@sprucelabs/heartwood-view-controllers'
import {
    diskUtil,
    HASH_SPRUCE_DIR_NAME,
    namesUtil,
} from '@sprucelabs/spruce-skill-utils'
import SpruceError from '../errors/SpruceError'
import { HealthCheckView } from '../types/view.types'

const vcDiskUtil = {
    loadViewControllers(
        activeDir: string,
        options?: { shouldThrowOnError?: boolean }
    ) {
        const { shouldThrowOnError = true } = options ?? {}
        const path = this.resolveCombinedViewsPath(activeDir)

        if (!path) {
            throw new Error(
                `Could not find path to skill views. Running \`spruce sync.views\` may help.`
            )
        }

        const { default: controllerMap, pluginsByName } = require(path)
        const controllers = Object.values(controllerMap) as (
            | (ViewController<any> & { name?: string })
            | (SkillViewController & { name?: string })
        )[]

        const vcs: ({
            Class?: ViewController<any>
        } & HealthCheckView)[] = []

        const svcs: ({
            Class?: SkillViewController
        } & HealthCheckView)[] = []

        const ids: string[] = []

        for (const controller of controllers) {
            const item: Partial<HealthCheckView & { Class?: any }> & {
                id: string
            } = {
                Class: controller,
                //@ts-ignore
                id: controller.id,
            }
            try {
                if (!item.id) {
                    const name = controller.name ?? 'Unknown View Controller'
                    throw new SpruceError({
                        code: 'INVALID_VIEW_CONTROLLER',
                        friendlyMessage: `${name} is missing \`public static id = '${namesUtil.toKebab(
                            name
                                .replace('ViewController', '')
                                .replace('SkillViewController', '')
                        )}'\``,
                        //@ts-ignore
                        id: controller.id,
                        name: controller.name,
                    })
                }
            } catch (err: any) {
                if (err instanceof AbstractSpruceError) {
                    if (shouldThrowOnError) {
                        throw err
                    }
                    item.error = err
                } else {
                    item.error = new SpruceError({
                        code: 'UNKNOWN_VIEW_CONTROLLER_ERROR',
                        originalError: err,
                        //@ts-ignore
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

        let theme:
            | SpruceSchemas.HeartwoodViewControllers.v2021_02_11.Theme
            | undefined

        const file = this.resolveThemeFile(activeDir)
        if (file && diskUtil.doesFileExist(file)) {
            const props = require(file).default
            theme = {
                name: 'Theme',
                props,
            }
        }

        return {
            svcs,
            vcs,
            ids,
            theme,
            pluginsByName: pluginsByName as ViewControllerPluginsByName,
        }
    },

    loadViewControllersAndBuildMap(namespace: string, vcDir: string) {
        const { vcs, svcs, pluginsByName } = this.loadViewControllers(vcDir)
        const map: Partial<ViewControllerMap> = {}

        const all = [...vcs, ...svcs]

        for (const item of all) {
            if (item.Class) {
                //@ts-ignore
                map[`${namespace}.${item.id}`] = item.Class
            }
        }

        return {
            map,
            pluginsByName,
        }
    },

    resolveCombinedViewsPath(activeDir: string) {
        return diskUtil.resolveFile(
            activeDir,
            HASH_SPRUCE_DIR_NAME,
            'views',
            'views'
        )
    },

    resolveThemeFile(activeDir: string) {
        return diskUtil.resolveFile(activeDir, 'themes', 'skill.theme')
    },
}

export default vcDiskUtil
