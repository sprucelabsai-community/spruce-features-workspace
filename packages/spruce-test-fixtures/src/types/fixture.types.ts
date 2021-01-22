import { MercuryClient } from '@sprucelabs/mercury-client'
import { Log, Skill } from '@sprucelabs/spruce-skill-utils'
import MercuryFixture from '../fixtures/MercuryFixture'
import OrganizationFixture from '../fixtures/OrganizationFixture'
import PersonFixture from '../fixtures/PersonFixture'
import { SkillFixture } from '../fixtures/SkillFixture'

export type ApiClientFactory = () => Promise<MercuryClient<any>>

export interface FixtureMap {
	person: PersonFixture
	organization: OrganizationFixture
	skill: SkillFixture
	mercury: MercuryFixture
}

export type FixtureName = keyof FixtureMap

export interface SkillFactoryOptions {
	activeDir?: string
	rootDir?: string
	hashSpruceDir?: string
	plugins?: ((skill: Skill) => void)[]
	log?: Log
}
