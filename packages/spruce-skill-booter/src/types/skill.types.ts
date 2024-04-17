import { Log } from '@sprucelabs/spruce-skill-utils'
import { Skill } from '@sprucelabs/spruce-skill-utils'

export interface SkillFactoryOptions {
    activeDir?: string
    rootDir?: string
    hashSpruceDir?: string
    plugins?: ((skill: Skill) => void)[]
    log?: Log
    shouldCountdownOnExit?: boolean
}

export interface TestBootWaitOptions {
    shouldSuppressBootErrors?: boolean
    shouldWaitForPostBoot?: boolean
}

export type TestBootOptions = SkillFactoryOptions &
    TestBootWaitOptions & { skill?: Skill }
