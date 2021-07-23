/* eslint-disable spruce/prohibit-import-from-build-folder */
import { SkillViewControllerId } from '@sprucelabs/heartwood-view-controllers'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import { test, assert } from '@sprucelabs/test'
import { errorAssertUtil } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import TestRouter from '../../tests/routers/TestRouter'
import BookSkillViewController from '../testDirsAndFiles/skill/build/skillViewControllers/Book.svc'
import SpySkillViewController from '../testDirsAndFiles/skill/build/skillViewControllers/Spy.svc'

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
	protected static vcDir = diskUtil.resolvePath(
		__dirname,
		'..',
		'testDirsAndFiles',
		'skill',
		'build'
	)

	@test()
	protected static async canCreateRouter() {
		this.router = this.Fixture('vc', { vcDir: this.vcDir }).getRouter()
		assert.isTruthy(this.router)
	}

	@test()
	protected static async throwsWithBadDestination() {
		const err = await assert.doesThrowAsync(() =>
			//@ts-ignore
			this.router.redirect('waka.waka')
		)

		errorAssertUtil.assertError(err, 'INVALID_VIEW_CONTROLLER_NAME', {
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
		await this.router.redirect(id, {})
		const vc = this.router.getPresentVc()
		assert.isTrue(vc instanceof Vc)
	}

	@test('redirect passes through args 1', { hey: 'there' })
	@test('redirect passes through args 2', { what: 'the!?' })
	protected static async redirectTriggersLoadWithExpectedItems(args: any) {
		//@ts-ignore
		const vc = await this.router.redirect('spruceTestFixtures.spy', args)
		const lastLoad = vc.loads.pop()
		assert.isTruthy(lastLoad)
		assert.isEqualDeep(lastLoad.args, args)
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

		await this.router.redirect('spruceTestFixtures.book', expectedArgs)

		assert.isTrue(wasHit)
		assert.isEqual(passedId, 'spruceTestFixtures.book')
		assert.isTruthy(passedVc)
		assert.isTrue(passedVc instanceof BookSkillViewController)
		assert.isEqualDeep(passedArgs, expectedArgs)
	}
}
