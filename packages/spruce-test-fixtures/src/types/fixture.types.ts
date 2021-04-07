import { MercuryClient } from '@sprucelabs/mercury-client'
import { SkillEventContract } from '@sprucelabs/mercury-types'
import MercuryFixture from '../fixtures/MercuryFixture'
import OrganizationFixture from '../fixtures/OrganizationFixture'
import PersonFixture from '../fixtures/PersonFixture'
import { SkillFixture } from '../fixtures/SkillFixture'
/** @ts-ignore */
export type ApiClientFactory = () => Promise<MercuryClient<SkillEventContract>>

export interface FixtureMap {
	person: PersonFixture
	organization: OrganizationFixture
	skill: SkillFixture
	mercury: MercuryFixture
}

export type FixtureName = keyof FixtureMap
