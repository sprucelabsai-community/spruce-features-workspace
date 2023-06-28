import {
	AbstractSkillViewController,
	CardViewControllerImpl,
	ScopeFlag,
	SpruceSchemas,
} from '@sprucelabs/heartwood-view-controllers'
import { assert, errorAssert, test } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import { DEMO_NUMBER_SCOPE } from '../../../tests/constants'
import fake from '../../../tests/decorators/fake'
import seed from '../../../tests/decorators/seed'
import SpyScope from '../../../tests/fixtures/SpyScope'

@fake.login(DEMO_NUMBER_SCOPE)
export default class TestingScopeTest extends AbstractSpruceFixtureTest {
	private static scope: SpyScope
	protected static async beforeEach() {
		await super.beforeEach()
		this.views = this.Fixture('view', {
			controllerMap: {
				scoped: ScopedSkillViewController,
			},
		})
		this.scope = this.views.getScope()
	}

	@test()
	protected static async canResetScope() {
		await this.seeder.resetAccount()

		this.scope.setCurrentLocation('aoeu')
		this.scope.setCurrentOrganization('aoeu')

		this.scope.clearSession()

		const location = await this.scope.getCurrentLocation()

		assert.isFalsy(location)
	}

	@test()
	@seed('organizations', 1)
	protected static async canSetCurrentOrgToNull() {
		this.scope.setCurrentOrganization(null)
		const org = await this.scope.getCurrentOrganization()
		assert.isNull(org)
	}

	@test()
	@seed('organizations', 1)
	@seed('locations', 1)
	protected static async canSetCurrentLocationToNull() {
		this.scope.setCurrentLocation(null)
		const org = await this.organizations.getNewestOrganization()
		assert.isTruthy(org)

		const location = await this.scope.getCurrentLocation()
		assert.isNull(location)
	}

	@test()
	protected static async clearsLocationIdWhenSettingOrgId() {
		this.scope.setCurrentLocation('aoeu')
		this.scope.setCurrentOrganization('aoeu')

		//@ts-ignore
		assert.isFalsy(this.scope.currentLocationId)
	}

	@test('can set flags 1', ['organization'])
	@test('can set flags 2', ['location'])
	@test('can set flags 3', ['organization', 'employed'])
	protected static async scopeFlagsCanBeSet(flags: ScopeFlag[]) {
		this.setFlags(flags)
		assert.isEqualDeep(this.scope.getFlags(), flags)
	}

	@test()
	protected static async noneScopeFlagsByDefault() {
		assert.isEqualDeep(this.scope.getFlags(), ['none'])
	}

	@test('get current location throws when scoped to organization', [
		'organization',
	])
	@test('get current location throws when scoped to none', ['none'])
	protected static async getCurrentLocationThrowsWhenScopedToOrg(
		flags: ScopeFlag[]
	) {
		this.setFlags(flags)
		const err = await assert.doesThrowAsync(() =>
			this.scope.getCurrentLocation()
		)

		errorAssert.assertError(err, 'INVALID_SCOPE_REQUEST', {
			flags,
			attemptedToGet: 'location',
		})
	}

	@test()
	protected static async getCurrentOrgThrowsWhenScopedToNone() {
		this.setFlags(['none'])

		const err = await assert.doesThrowAsync(() =>
			this.scope.getCurrentOrganization()
		)

		errorAssert.assertError(err, 'INVALID_SCOPE_REQUEST', {
			flags: ['none'],
			attemptedToGet: 'organization',
		})
	}

	@test('can get lecation when scoped to location', ['location'])
	@test('can get lecation when scoped to location and employed', [
		'employed',
		'location',
	])
	@seed('locations', 1)
	protected static async canGetCurrentLocationWhenScopedToLocation(
		flags: ScopeFlag[]
	) {
		this.setFlags(flags)
		const location = await this.scope.getCurrentLocation()
		assert.isTruthy(location)
	}

	@test('can get current org when scoped to org', ['organization'])
	@test('can get current org when scoped to org and employed', [
		'employed',
		'organization',
	])
	@seed('organizations', 1)
	protected static async canGetCurrentOrganizationWhenScopedToOrg(
		flags: ScopeFlag[]
	) {
		this.setFlags(flags)
		const org = await this.scope.getCurrentOrganization()
		assert.isTruthy(org)
	}

	@test('loading svc sets flags 1', ['location'])
	@test('loading svc sets flags 2', ['organization'])
	@seed('locations', 1)
	protected static async loadingAVcSetsFlags(flags: ScopeFlag[]) {
		ScopedSkillViewController.scopeFlags = flags
		const vc = this.views.Controller('scoped' as any, {})
		await this.views.load(vc)
		assert.isEqualDeep(
			this.scope.getFlags(),
			ScopedSkillViewController.scopeFlags
		)
	}

	private static setFlags(flags: ScopeFlag[]) {
		this.scope.setFlags(flags)
	}
}

class ScopedSkillViewController extends AbstractSkillViewController {
	public static scopeFlags: ScopeFlag[] = []
	public getScope(): ScopeFlag[] {
		return ScopedSkillViewController.scopeFlags
	}

	public render(): SpruceSchemas.HeartwoodViewControllers.v2021_02_11.SkillView {
		return {
			layouts: [],
		}
	}
}
