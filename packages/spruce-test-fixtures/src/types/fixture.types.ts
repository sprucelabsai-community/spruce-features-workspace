import { DatabaseFixture } from '@sprucelabs/data-stores'
import { MercuryClient } from '@sprucelabs/mercury-client'
import LocationFixture from '../tests/fixtures/LocationFixture'
import MercuryFixture, {
	ApiClientFactoryOptions,
} from '../tests/fixtures/MercuryFixture'
import OrganizationFixture from '../tests/fixtures/OrganizationFixture'
import PersonFixture from '../tests/fixtures/PersonFixture'
import SkillFixture from '../tests/fixtures/SkillFixture'
import StoreFixture from '../tests/fixtures/StoreFixture'
import ViewFixture from '../tests/fixtures/ViewFixture'
import MockSkillViewController from '../tests/Mock.svc'

export type ApiClientFactory = (
	options?: ApiClientFactoryOptions
) => Promise<MercuryClient>

export interface FixtureClassMap {
	person: typeof PersonFixture
	organization: typeof OrganizationFixture
	skill: typeof SkillFixture
	mercury: typeof MercuryFixture
	store: typeof StoreFixture
	database: typeof DatabaseFixture
	view: typeof ViewFixture
	location: typeof LocationFixture
}

export type FixtureMap = {
	[K in keyof FixtureClassMap]: InstanceType<FixtureClassMap[K]>
}

export type FixtureConstructorOptionsMap = {
	[K in keyof FixtureClassMap]: ConstructorParameters<FixtureClassMap[K]>[0]
}

export type FixtureName = keyof FixtureMap

declare module '@sprucelabs/heartwood-view-controllers/build/types/heartwood.types' {
	interface SkillViewControllerMap {
		'heartwood.root': MockSkillViewController
	}

	interface SkillViewControllerArgsMap {
		'heartwood.root': Parameters<MockSkillViewController['load']>[0]['args']
	}

	interface ViewControllerMap {
		'heartwood.root': MockSkillViewController
	}
}
