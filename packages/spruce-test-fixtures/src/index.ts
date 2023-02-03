export { default as AbstractSpruceFixtureTest } from './tests/AbstractSpruceFixtureTest'
export * from './types/fixture.types'
export * from './types/view.types'
export * from './types/store.types'
export { default as OrganizationFixture } from './tests/fixtures/OrganizationFixture'
export { default as StoreFixture } from './tests/fixtures/StoreFixture'
export { default as PersonFixture } from './tests/fixtures/PersonFixture'
export { default as SkillFixture } from './tests/fixtures/SkillFixture'
export { default as LocationFixture } from './tests/fixtures/LocationFixture'
export { default as ViewFixture } from './tests/fixtures/ViewFixture'
export { default as RoleFixture } from './tests/fixtures/RoleFixture'
export { default as ViewControllerFixture } from './tests/fixtures/ViewFixture'
export { default as MercuryFixture } from './tests/fixtures/MercuryFixture'
export { default as FakeSkillViewController } from './tests/Fake.svc'
export { default as vcDiskUtil } from './utilities/vcDisk.utility'
export { default as TestRouter } from './tests/routers/TestRouter'
export { default as seed } from './tests/decorators/seed'
export { default as login } from './tests/decorators/login'
export { default as install } from './tests/decorators/install'
export { default as fake } from './tests/decorators/fake'
export { default as eventFaker } from './tests/eventFaker'
export { default as eventMocker } from './tests/eventMocker'
export { default as ClientProxyDecorator } from './ClientProxyDecorator'
export { default as FakeThemeManager } from './__tests__/support/FakeThemeManager'
export { default as SpyScope } from './tests/fixtures/SpyScope'
export { default as FakeAuthorizer } from './tests/FakeAuthorizer'
/**
 * @deprecated phoneNumberIncrementer -> phoneNumberIncrementor
 */
export { default as phoneNumberIncrementer } from './utilities/phoneNumberIncrementor'
export { default as phoneNumberIncrementor } from './utilities/phoneNumberIncrementor'

export * from '#spruce/schemas/schemas.types'
