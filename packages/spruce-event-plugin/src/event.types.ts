import { MercuryClient } from '@sprucelabs/mercury-client'

declare module '@sprucelabs/spruce-skill-utils/build/types/skill.types' {
	interface SkillContext {
		client: MercuryClient
	}
}
