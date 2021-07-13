/* eslint-disable spruce/prohibit-import-from-build-folder */
import { SkillViewControllerId } from '@sprucelabs/heartwood-view-controllers'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import { test, assert } from '@sprucelabs/test'
import { errorAssertUtil } from '@sprucelabs/test-utils'
import AbstractViewControllerTest from '../../tests/AbstractViewControllerTest'
import { TestRouter } from '../../tests/routers/TestRouter'
import BookSkillViewController from '../testDirsAndFiles/skill/build/skillViewControllers/Book.svc'
import SpySkillViewController from '../testDirsAndFiles/skill/build/skillViewControllers/Spy.svc'

declare module '@sprucelabs/heartwood-view-controllers/build/types/heartwood.types' {
	interface ViewControllerMap {
		book: BookSkillViewController
		spy: SpySkillViewController
	}

	interface SkillViewControllerMap {
		book: BookSkillViewController
		spy: SpySkillViewController
	}
}

export default class RoutingTest extends AbstractViewControllerTest {
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
		this.router = new TestRouter(this.getFactory())
		assert.isTruthy(this.router)
	}

	@test()
	protected static async throwsWithBadDestination() {
		const err = await assert.doesThrowAsync(() =>
			//@ts-ignore
			this.router.redirect('waka.waka')
		)

		errorAssertUtil.assertError(err, 'INVALID_VIEW_CONTROLLER', {
			name: 'waka.waka',
		})
	}

	@test()
	protected static async getPresentVcIsEmptyToStart() {
		assert.isFalsy(this.router.getPresentVc())
	}

	@test('can get book svc', 'book', BookSkillViewController)
	@test('can get spy svc', 'spy', SpySkillViewController)
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
		const vc = await this.router.redirect('spy', args)
		const lastLoad = vc.loads.pop()
		assert.isTruthy(lastLoad)
		assert.isEqualDeep(lastLoad.args, args)
	}
}
