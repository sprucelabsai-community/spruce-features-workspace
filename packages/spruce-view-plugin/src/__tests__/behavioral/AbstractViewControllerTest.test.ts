import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import { assert, test } from '@sprucelabs/test'
import AbstractViewControllerTest from '../../tests/AbstractViewControllerTest'
// eslint-disable-next-line spruce/prohibit-import-from-build-folder
import BookSkillViewController from '../testDirsAndFiles/skill/build/skillViewControllers/Book.svc'

declare module '@sprucelabs/heartwood-view-controllers/build/types/heartwood.types' {
	interface ViewControllerMap {
		book: BookSkillViewController
	}
}

export default class AbstractViewControllerTestTest extends AbstractViewControllerTest {
	protected static vcDir = diskUtil.resolvePath(
		__dirname,
		'..',
		'testDirsAndFiles',
		'skill',
		'build'
	)

	@test()
	protected static hasControllerFactoryMethod() {
		assert.isFunction(this.Controller)
	}

	@test()
	protected static async throwsErrorWithBadDir() {
		const oldDir = this.vcDir
		this.vcDir = 'taco'
		const err = assert.doesThrow(() => this.Controller('book', {}))
		assert.doesInclude(err.message, '.spruce')
		this.vcDir = oldDir
	}

	@test()
	protected static async buildController() {
		const vc = this.Controller('book', {})
		assert.isTruthy(vc)
		const model = vc.render()
		assert.isTruthy(model)
	}
}
