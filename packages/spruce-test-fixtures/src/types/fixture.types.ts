import { DatabaseFixture } from '@sprucelabs/data-stores'
import { MercuryClient } from '@sprucelabs/mercury-client'
import MercuryFixture from '../fixtures/MercuryFixture'
import OrganizationFixture from '../fixtures/OrganizationFixture'
import PersonFixture from '../fixtures/PersonFixture'
import { SkillFixture } from '../fixtures/SkillFixture'
import StoreFixture from '../fixtures/StoreFixture'

export type ApiClientFactory = () => Promise<MercuryClient>

export interface FixtureMap {
	person: PersonFixture
	organization: OrganizationFixture
	skill: SkillFixture
	mercury: MercuryFixture
	store: StoreFixture
	database: DatabaseFixture
}

export type FixtureName = keyof FixtureMap
