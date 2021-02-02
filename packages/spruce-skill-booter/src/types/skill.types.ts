import { Log } from '@sprucelabs/spruce-skill-utils'
import Skill from '../skills/Skill'

export interface SkillFactoryOptions {
	activeDir?: string
	rootDir?: string
	hashSpruceDir?: string
	plugins?: ((skill: Skill) => void)[]
	log?: Log
}
