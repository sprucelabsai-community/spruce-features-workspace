import {
	AbstractSkillViewController,
	AuthenticatorImpl,
	SkillViewControllerLoadOptions,
} from '@sprucelabs/heartwood-view-controllers'
import { formatPhoneNumber } from '@sprucelabs/schema'
import { assert, test } from '@sprucelabs/test'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import { DEMO_NUMBER_VIEW_FIXTURE } from '../../tests/constants'
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
	@test()
	protected static async canLogin() {
		const auth = AuthenticatorImpl.getInstance()
		assert.isFalsy(auth.getPerson())

		const { person } = await this.Fixture('view').loginAsDemoPerson(
			process.env.DEMO_NUMBER_VIEW_FIXTURE as string
		)

		const loggedIn = auth.getPerson()

		assert.isTruthy(loggedIn)
		assert.isEqualDeep(loggedIn, person)
	}

	@test()
	protected static async loginFallsBackToDemoNumber() {
		const { person } = await this.Fixture('view').loginAsDemoPerson()
		assert.isEqual(
			person.phone,
			formatPhoneNumber(process.env.DEMO_NUMBER ?? '')
		)
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
		await fixture.load(vc)

		const scope = vc.loadOptions?.scope

		assert.isTruthy(scope)

		let org = await scope.getCurrentOrganization()
		assert.isNull(org)

		const created = await this.Fixture('organization').seedDemoOrg({
			name: 'Scope org',
		})

		scope.setCurrentOrganization(created.id)

		org = await scope.getCurrentOrganization()

		assert.isEqualDeep(org, created)
	}

	@test()
	protected static async scopeCanGetAndSetLocation() {
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
		const org = await this.Fixture('organization').seedDemoOrg({
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

		await fixture.load(vc)

		const current = await vc.loadOptions?.scope.getCurrentOrganization()

		assert.isNull(current)
	}

	@test()
	protected static fixturesShareVcFactory() {
		const fixture1 = this.Fixture('view')
		const fixture2 = this.Fixture('view')

		//@ts-ignore
		assert.isEqual(fixture1.vcFactory, fixture2.vcFactory)
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

	private static Scope() {
		const fixture = this.Fixture('view', {
			controllerMap: {
				scope: ScopeSvc,
			},
		})
		const factory = fixture.getFactory()

		const vc = factory.Controller('scope', {})
		return { vc, fixture }
	}
}
