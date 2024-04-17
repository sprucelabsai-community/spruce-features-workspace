import { DatabaseFixture } from '@sprucelabs/data-stores'
import { ConnectionOptions, MercuryClient } from '@sprucelabs/mercury-client'
import { SpruceSchemas } from '@sprucelabs/mercury-types'
import FakeSkillViewController from '../tests/Fake.svc'
import LocationFixture from '../tests/fixtures/LocationFixture'
import MercuryFixture from '../tests/fixtures/MercuryFixture'
import OrganizationFixture from '../tests/fixtures/OrganizationFixture'
import PermissionFixture from '../tests/fixtures/PermissionFixture'
import PersonFixture from '../tests/fixtures/PersonFixture'
import RoleFixture from '../tests/fixtures/RoleFixture'
import SeedFixture from '../tests/fixtures/SeedFixture'
import SkillFixture from '../tests/fixtures/SkillFixture'
import StoreFixture from '../tests/fixtures/StoreFixture'
import ViewFixture from '../tests/fixtures/ViewFixture'

export interface TestConnectionOptions {
    shouldReUseClient?: boolean
}

export type ConnectOptions = TestConnectionOptions & ConnectionOptions

export type TestConnectFactory = (
    options?: ConnectOptions
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
    role: typeof RoleFixture
    seed: typeof SeedFixture
    permission: typeof PermissionFixture
}

export type RoleBase = NonNullable<
    SpruceSchemas.Spruce.v2020_07_22.Role['base']
>

export type FixtureMap = {
    [K in keyof FixtureClassMap]: InstanceType<FixtureClassMap[K]>
}

export type FixtureConstructorOptionsMap = {
    [K in keyof FixtureClassMap]: ConstructorParameters<FixtureClassMap[K]>[0]
}

export type FixtureName = keyof FixtureMap

declare module '@sprucelabs/heartwood-view-controllers/build/types/heartwood.types' {
    interface SkillViewControllerMap {
        'heartwood.root': FakeSkillViewController
    }

    interface SkillViewControllerArgsMap {
        'heartwood.root': Parameters<FakeSkillViewController['load']>[0]['args']
    }

    interface ViewControllerMap {
        'heartwood.root': FakeSkillViewController
    }
}
