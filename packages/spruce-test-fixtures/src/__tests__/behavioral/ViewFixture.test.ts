import {
	AbstractSkillViewController,
	ActiveRecordCardViewController,
	AuthenticatorImpl,
	buildForm,
	SkillViewControllerLoadOptions,
	vcAssertUtil,
} from '@sprucelabs/heartwood-view-controllers'
import { formatPhoneNumber } from '@sprucelabs/schema'
import { assert, test } from '@sprucelabs/test'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import { DEMO_NUMBER_VIEW_FIXTURE, DEMO_NUMBER } from '../../tests/constants'
import ViewFixture from '../../tests/fixtures/ViewFixture'
import MockSkillViewController from '../../tests/Mock.svc'

class ScopeSvc extends AbstractSkillViewController {
	public loadOptions: SkillViewControllerLoadOptions | null = null

	public async load(options: SkillViewControllerLoadOptions) {
		this.loadOptions = options
	}

	public render() {
		return {
			layouts: [],
		}
	}
}

declare module '@sprucelabs/heartwood-view-controllers/build/types/heartwood.types' {
	interface ViewControllerMap {
		scope: ScopeSvc
	}
}

export default class ViewFixtureTest extends AbstractSpruceFixtureTest {
	private static fixture: ViewFixture

	protected static async beforeEach() {
		await super.beforeEach()

		this.fixture = this.Fixture('view', {
			controllerMap: {
				scope: ScopeSvc,
			},
		})

		await this.Fixture('seed').resetAccount(DEMO_NUMBER_VIEW_FIXTURE)
	}

	@test()
	protected static async canLogin() {
		const auth = AuthenticatorImpl.getInstance()
		assert.isFalsy(auth.getPerson())

		const { person } = await this.Fixture('view').loginAsDemoPerson(
			DEMO_NUMBER_VIEW_FIXTURE
		)

		const loggedIn = auth.getPerson()

		assert.isTruthy(loggedIn)
		assert.isEqualDeep(loggedIn, person)
	}

	@test()
	protected static async loginFallsBackToDemoNumber() {
		const { person } = await this.Fixture('view').loginAsDemoPerson()
		assert.isEqual(person.phone, formatPhoneNumber(DEMO_NUMBER ?? ''))
	}

	@test()
	protected static async canSetHeartwoodRoot() {
		const fixture = this.Fixture('view', {
			controllerMap: {
				'heartwood.root': true,
			},
		})

		const factory = fixture.getFactory()

		//@ts-ignore
		assert.isTrue(factory.controllerMap['heartwood.root'])
	}

	@test()
	protected static fixturesShouldShareConnectToApiReferences() {
		const fixture1 = this.Fixture('view')
		const fixture2 = this.Fixture('view')

		//@ts-ignore
		assert.isEqual(fixture1.connectToApi, fixture2.connectToApi)
	}

	@test()
	protected static canPassThroughPersonFixture() {
		const personFixture = this.Fixture('person')
		const viewFixture = this.Fixture('view', { personFixture })

		//@ts-ignore
		assert.isEqual(viewFixture.personFixture, personFixture)
	}

	@test()
	protected static async feedsInScope() {
		const { vc, fixture } = this.Scope()

		assert.isNull(vc.loadOptions)

		await fixture.load(vc)

		assert.isTruthy(vc.loadOptions)
		assert.isTruthy(vc.loadOptions.scope)
	}

	@test()
	protected static async scopeCanGetAndSetOrganization() {
		const { vc, fixture } = this.Scope()

		await fixture.loginAsDemoPerson(DEMO_NUMBER_VIEW_FIXTURE)

		await fixture.load(vc)

		const scope = vc.loadOptions?.scope

		assert.isTruthy(scope)

		let org = await scope.getCurrentOrganization()
		assert.isNull(org)

		const created = await this.Fixture('organization').seedDemoOrganization({
			name: 'Scope org',
			phone: DEMO_NUMBER_VIEW_FIXTURE,
		})

		scope.setCurrentOrganization(created.id)

		org = await scope.getCurrentOrganization()

		assert.isEqualDeep(org, created)
	}

	@test()
	protected static async scopeGetsLastOrgByDefault() {
		const organizationFixture = this.Fixture('organization')
		await organizationFixture.seedDemoOrganization({
			name: 'Scope org',
			phone: DEMO_NUMBER_VIEW_FIXTURE,
		})

		await organizationFixture.seedDemoOrganization({
			name: 'Scope org',
			phone: DEMO_NUMBER_VIEW_FIXTURE,
		})

		const expected = await organizationFixture.seedDemoOrganization({
			name: 'Scope org',
			phone: DEMO_NUMBER_VIEW_FIXTURE,
		})

		const viewFixture = this.Fixture('view')
		await viewFixture.loginAsDemoPerson(DEMO_NUMBER_VIEW_FIXTURE)

		const current = await viewFixture.getScope().getCurrentOrganization()

		assert.isEqualDeep(current, expected)
	}

	@test()
	protected static async scopeGetsLastLocationByDefault() {
		const organizationFixture = this.Fixture('organization')
		const org = await organizationFixture.seedDemoOrganization({
			name: 'Scope org',
			phone: DEMO_NUMBER_VIEW_FIXTURE,
		})

		const locationFixture = this.Fixture('location')

		await locationFixture.seedDemoLocation({
			organizationId: org.id,
			phone: DEMO_NUMBER_VIEW_FIXTURE,
		})

		await locationFixture.seedDemoLocation({
			organizationId: org.id,
			phone: DEMO_NUMBER_VIEW_FIXTURE,
		})

		const expected = await locationFixture.seedDemoLocation({
			organizationId: org.id,
			phone: DEMO_NUMBER_VIEW_FIXTURE,
		})

		const viewFixture = this.Fixture('view')
		await viewFixture.loginAsDemoPerson(DEMO_NUMBER_VIEW_FIXTURE)

		const current = await viewFixture.getScope().getCurrentLocation()

		assert.isEqualDeep(current, expected)
	}

	@test()
	protected static async scopeCanGetAndSetLocation() {
		await this.fixture.loginAsDemoPerson(DEMO_NUMBER_VIEW_FIXTURE)

		const { vc, fixture } = this.Scope()

		await fixture.load(vc)

		const scope = vc.loadOptions?.scope

		assert.isTruthy(scope)

		let location = await scope.getCurrentLocation()
		assert.isNull(location)

		const created = await this.Fixture('location').seedDemoLocation({
			name: 'Scope org',
			phone: DEMO_NUMBER_VIEW_FIXTURE,
		})

		scope.setCurrentLocation(created.id)

		location = await scope.getCurrentLocation()

		assert.isEqualDeep(location, created)
	}

	@test()
	protected static async sharesPersonFixture() {
		const { fixture } = this.Scope()
		assert.isEqual(
			//@ts-ignore
			fixture.personFixture,
			//@ts-ignore
			fixture.organizationFixture.personFixture
		)

		assert.isEqual(
			//@ts-ignore
			fixture.personFixture,
			//@ts-ignore
			fixture.locationFixture.personFixture
		)

		assert.isEqual(
			//@ts-ignore
			fixture.organizationFixture,
			//@ts-ignore
			fixture.locationFixture.organizationFixture
		)
	}

	@test()
	protected static async canSetScopeForCurrentOrganizationAccrossViewFixtures() {
		const org = await this.Fixture('organization').seedDemoOrganization({
			phone: DEMO_NUMBER_VIEW_FIXTURE,
			name: 'My new org!',
		})

		this.Fixture('view').getScope().setCurrentOrganization(org.id)

		const { vc, fixture } = this.Scope()

		await fixture.load(vc)

		const current = await vc.loadOptions?.scope.getCurrentOrganization()

		assert.isEqualDeep(current, org)
	}

	@test()
	protected static async scopeShouldBeResetEachRun() {
		const { vc, fixture } = this.Scope()

		await fixture.loginAsDemoPerson(DEMO_NUMBER_VIEW_FIXTURE)

		await fixture.load(vc)

		const current = await vc.loadOptions?.scope.getCurrentOrganization()

		assert.isNull(current)
	}

	@test()
	protected static fixturesShareVcFactory() {
		const options = {
			controllerMap: {
				'heartwood.root': true,
			},
		}

		const fixture1 = this.Fixture('view', options)
		const fixture2 = this.Fixture('view', options)

		assert.isEqual(fixture1.getFactory(), fixture2.getFactory())
	}

	@test()
	protected static async mixesInControllerMapWithLocalViews() {
		await this.bootAndRegisterSkillFromTestDir('skill')

		const fixture = this.Fixture('view', {
			controllerMap: {
				'new.view': MockSkillViewController,
			},
		})

		const factory = fixture.getFactory()

		//@ts-ignore
		factory.Controller('views.book', {})

		//@ts-ignore
		factory.Controller('new.view', {})
	}

	@test()
	protected static fixturesContinueToMixinViewControllers() {
		this.Fixture('view', {
			controllerMap: {
				'new.view': MockSkillViewController,
			},
		}).getFactory()

		const fixture = this.Fixture('view', {
			controllerMap: {
				'new.view2': MockSkillViewController,
			},
		})

		//@ts-ignore
		fixture.getFactory().Controller('new.view2')
	}

	@test()
	protected static fixtureAttachesRenderCount() {
		const vc = this.MockVc()

		vcAssertUtil.assertTriggerRenderCount(vc, 0)

		vc.triggerRender()

		vcAssertUtil.assertTriggerRenderCount(vc, 1)
	}

	@test()
	protected static async fixturePatchesAlertToThrow() {
		const vc = this.MockVc()
		//@ts-ignore
		assert.isFunction(vc._originalAlert)
		//@ts-ignore
		await assert.doesThrowAsync(() => vc.alert())
	}

	@test()
	protected static canGetAuthenticatorInstance() {
		const viewFixture = this.Fixture('view', {
			controllerMap: {
				card: MockSkillViewController,
			},
		})

		assert.isFunction(viewFixture.getAuthenticator)
		assert.isEqual(
			viewFixture.getAuthenticator(),
			AuthenticatorImpl.getInstance()
		)
	}

	@test()
	protected static activeRecordThrowsByDefault() {
		//@ts-ignore
		assert.isTrue(ActiveRecordCardViewController.shouldThrowOnResponseError)
		ActiveRecordCardViewController.setShouldThrowOnResponseError(false)
	}

	@test()
	protected static activeRecordThrowReset() {
		//@ts-ignore
		assert.isTrue(ActiveRecordCardViewController.shouldThrowOnResponseError)
	}

	@test()
	protected static async patchesFormsToThrow() {
		const viewFixture = this.Fixture('view', {
			controllerMap: {},
		})
		const formVc = viewFixture.Controller(
			'form',
			buildForm({
				id: 'test',
				schema: { id: 'test', fields: {} },
				sections: [],
			})
		)

		await assert.doesThrowAsync(() => formVc.submit())
	}

	private static Scope() {
		const factory = this.fixture.getFactory()
		const vc = factory.Controller('scope', {})

		return { vc, fixture: this.fixture }
	}

	private static MockVc() {
		const viewFixture = this.Fixture('view', {
			controllerMap: {
				card: MockSkillViewController,
			},
		})
		const factory = viewFixture.getFactory()

		const vc = factory.Controller('card', {
			header: { title: 'hey' },
		})
		return vc
	}
}
