/* eslint-disable spruce/prohibit-import-from-build-folder */
import { LocaleImpl } from '@sprucelabs/calendar-utils'
import {
	SkillViewControllerId,
	vcAssert,
	ViewControllerFactory,
} from '@sprucelabs/heartwood-view-controllers'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import { test, assert } from '@sprucelabs/test'
import { errorAssert } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import FakeSkillViewController from '../../../tests/Fake.svc'
import TestRouter from '../../../tests/routers/TestRouter'
import SpyAuthorizer from '../../../tests/SpyAuthorizer'
import BookSkillViewController from '../../testDirsAndFiles/skill/build/skillViewControllers/Book.svc'
import SpySkillViewController from '../../testDirsAndFiles/skill/build/skillViewControllers/Spy.svc'

declare module '@sprucelabs/heartwood-view-controllers/build/types/heartwood.types' {
	interface ViewControllerMap {
		'spruceTestFixtures.book': BookSkillViewController
		'spruceTestFixtures.spy': SpySkillViewController
	}

	interface SkillViewControllerMap {
		'spruceTestFixtures.book': BookSkillViewController
		'spruceTestFixtures.spy': SpySkillViewController
	}
}

export default class RoutingTest extends AbstractSpruceFixtureTest {
	private static router: TestRouter
	private static factory: ViewControllerFactory

	protected static vcDir = diskUtil.resolvePath(
		__dirname,
		'..',
		'..',
		'testDirsAndFiles',
		'skill',
		'build'
	)

	protected static async beforeEach() {
		await super.beforeEach()

		const fixture = this.Fixture('view', { vcDir: this.vcDir })

		this.router = fixture.getRouter()
		this.factory = fixture.getFactory()
	}

	@test()
	protected static async throwsWithBadDestination() {
		const err = await assert.doesThrowAsync(() =>
			//@ts-ignore
			this.assertRedirects(() => this.router.redirect('waka.waka'))
		)

		errorAssert.assertError(err, 'INVALID_VIEW_CONTROLLER_NAME', {
			name: 'waka.waka',
		})
	}

	@test()
	protected static async getPresentVcIsEmptyToStart() {
		assert.isFalsy(this.router.getPresentVc())
	}

	@test('can get book svc', 'spruceTestFixtures.book', BookSkillViewController)
	@test('can get spy svc', 'spruceTestFixtures.spy', SpySkillViewController)
	protected static async canRedirectToGoodSvcWithoutNamespace(
		id: SkillViewControllerId,
		Vc: any
	) {
		await this.assertRedirects(() => this.router.redirect(id, {}))
		const vc = this.router.getPresentVc()
		assert.isTrue(vc instanceof Vc)
	}

	@test('redirect calls load on destination vc if set 1', { hey: 'there' })
	@test('redirect calls load on destination vc if set 2', { what: 'the!?' })
	protected static async redirectTriggersLoadWithExpectedItems(args: any) {
		TestRouter.setShouldLoadDestinationVc(false)

		//@ts-ignore
		const vc = await this.assertRedirects(() =>
			this.router.redirect('spruceTestFixtures.spy', args)
		)

		const lastLoad = vc.loads.pop()
		assert.isFalsy(lastLoad)
	}

	@test('redirect does not call load on destination vc 1', { hey: 'there' })
	@test('redirect does not call load on destination vc 2', { what: 'the!?' })
	protected static async redirectByDefaultDoesNotLoadWithExpectedItems(
		args: any
	) {
		//@ts-ignore
		const vc = await this.assertRedirects(() =>
			this.router.redirect('spruceTestFixtures.spy', args)
		)
		const lastLoad = vc.loads.pop()
		assert.isFalsy(lastLoad)
	}

	@test('can hook into redirect no args', undefined)
	@test('can hook into redirect args 1', { taco: 'bell' })
	protected static async canHookIntoRedirectEvents(expectedArgs: any) {
		let wasHit = false
		let passedId = ''
		let passedVc: any = null
		let passedArgs: any = null

		await this.router.on('did-redirect', ({ id, vc, args }) => {
			wasHit = true
			passedId = id
			passedVc = vc
			passedArgs = args
		})

		await this.assertRedirects(() =>
			this.router.redirect('spruceTestFixtures.book', expectedArgs)
		)

		assert.isTrue(wasHit)
		assert.isEqual(passedId, 'spruceTestFixtures.book')
		assert.isTruthy(passedVc)
		assert.isTrue(passedVc instanceof BookSkillViewController)
		assert.isEqualDeep(passedArgs, expectedArgs)
	}

	@test()
	protected static async canFakeRedirectToHeartwoodRoot() {
		const svc = await this.assertRedirects(() =>
			this.router.redirect('heartwood.root')
		)

		assert.isTrue(svc instanceof FakeSkillViewController)
	}

	@test()
	protected static async canSuppressBadControllerIdOnRedirect() {
		TestRouter.setShouldThrowWhenRedirectingToBadSvc(false)

		const id = `${new Date().getTime()}.root`

		//@ts-ignore
		this.factory.setController(id, null)

		await this.assertRedirects(() => this.router.redirect(id as any))
	}

	@test()
	protected static async shouldThrowWithBadSvcBecauseTestRouterIsReset() {
		await assert.doesThrowAsync(() =>
			//@ts-ignore
			this.router.redirect('waka.waka')
		)
	}

	@test()
	protected static testRouterBuildsOptionsWithLocaleAndAuthorizer() {
		const options = this.router.buildLoadOptions()
		assert.isTrue(options.locale instanceof LocaleImpl)
		assert.isTrue(options.authorizer instanceof SpyAuthorizer)
	}

	private static async assertRedirects(action: () => Promise<any>) {
		return vcAssert.assertActionRedirects({
			action,
			router: this.router,
		})
	}
}
