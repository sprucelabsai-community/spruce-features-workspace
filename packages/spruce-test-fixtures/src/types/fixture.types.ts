import { DatabaseFixture } from '@sprucelabs/data-stores'
import { MercuryClient } from '@sprucelabs/mercury-client'
import MercuryFixture from '../tests/fixtures/MercuryFixture'
import OrganizationFixture from '../tests/fixtures/OrganizationFixture'
import PersonFixture from '../tests/fixtures/PersonFixture'
import SkillFixture from '../tests/fixtures/SkillFixture'
import StoreFixture from '../tests/fixtures/StoreFixture'
import ViewControllerFixture from '../tests/fixtures/ViewControllerFixture'

export type ApiClientFactory = () => Promise<MercuryClient>

export interface FixtureMap {
	person: PersonFixture
	organization: OrganizationFixture
	skill: SkillFixture
	mercury: MercuryFixture
	store: StoreFixture
	database: DatabaseFixture
	vc: ViewControllerFixture
}

export type FixtureName = keyof FixtureMap
