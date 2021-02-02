import { MercuryClient } from '@sprucelabs/mercury-client'
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
