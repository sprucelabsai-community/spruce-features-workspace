import {
    diskUtil,
    pluginUtil,
    Skill,
    stubLog,
} from '@sprucelabs/spruce-skill-utils'
import { default as SkillImpl } from '../skills/Skill'
import { SkillFactoryOptions, TestBootWaitOptions } from '../types/skill.types'

export default class SkillTestBooter {
    public static async Skill(
        options: SkillFactoryOptions & { cwd: string; buildPath: string }
    ) {
        const { plugins = [], log = stubLog, cwd, buildPath } = options ?? {}

        const skill = new SkillImpl({
            rootDir: cwd,
            shouldCountdownOnExit: false,
            activeDir: buildPath,
            hashSpruceDir: cwd,
            log,
            ...options,
        }) as Skill

        for (const plugin of plugins) {
            plugin(skill)
        }

        if (diskUtil.doesBuiltHashSprucePathExist(cwd)) {
            const dir = diskUtil.resolveBuiltHashSprucePath(cwd)
            await pluginUtil.import([skill], dir)
        }
        return skill
    }

    public static async bootSkillAndWait(
        options: TestBootWaitOptions & {
            skill: Skill
            onSuppressedError: (err: any) => void
        }
    ) {
        const {
            shouldWaitForDidBoot: shouldWaitForDidBoot = true,
            skill,
            onSuppressedError,
        } = options

        const results = await new Promise((resolve, reject) => {
            let executionPromise: Promise<any>

            const cb = async () => {
                resolve({ skill, executionPromise })
            }

            if (shouldWaitForDidBoot) {
                skill.onPostBoot(cb)
            } else {
                skill.onBoot(cb)
            }

            executionPromise = skill.execute()

            executionPromise.catch((err) => {
                if (options?.shouldSuppressBootErrors) {
                    onSuppressedError(err)
                    resolve({ skill, executionPromise })
                } else {
                    reject(err)
                }
            })
        })
        return results
    }
}

export interface BootSkillAndWaitResults {
    skill: Skill
    executionPromise: Promise<void>
}
