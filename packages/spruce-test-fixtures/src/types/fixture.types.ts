import { DatabaseFixture } from '@sprucelabs/data-stores'
import { MercuryClient } from '@sprucelabs/mercury-client'
import { SkillEventContract } from '@sprucelabs/mercury-types'
import MercuryFixture from '../fixtures/MercuryFixture'
import OrganizationFixture from '../fixtures/OrganizationFixture'
import PersonFixture from '../fixtures/PersonFixture'
import { SkillFixture } from '../fixtures/SkillFixture'
import StoreFixture from '../fixtures/StoreFixture'
/** @ts-ignore */
export type ApiClientFactory = () => Promise<MercuryClient<SkillEventContract>>

export interface FixtureMap {
	person: PersonFixture
	organization: OrganizationFixture
	skill: SkillFixture
	mercury: MercuryFixture
	store: StoreFixture
	database: DatabaseFixture
}

export type FixtureName = keyof FixtureMap
