import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import { assert, test } from '@sprucelabs/test'
import globby from 'globby'
import AbstractViewControllerTest from '../../tests/AbstractViewControllerTest'
// eslint-disable-next-line spruce/prohibit-import-from-build-folder
import BookSkillViewController from '../testDirsAndFiles/skill/build/skillViewControllers/Book.svc'

declare module '@sprucelabs/heartwood-view-controllers/build/types/heartwood.types' {
	interface ViewControllerMap {
		book: typeof BookSkillViewController
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

	@test()
	protected static async canBuildControllersSourcedFromTsFiles() {
		this.cwd = await this.copySkillFromTestDirToTmpDir2('skill')
		this.vcDir = this.resolvePath(this.cwd, 'build')

		const matches = await globby(this.resolvePath('build', '**/*.js'), {
			dot: true,
		})
		for (const source of matches) {
			const destination = source.replace('.js', '.ts')
			diskUtil.moveFile(source, destination)
		}

		const vc = this.Controller('book', {})
		assert.isTruthy(vc)
		const model = vc.render()
		assert.isTruthy(model)
	}

	private static async copySkillFromTestDirToTmpDir2(
		testDirName: string
	): Promise<string> {
		const destination = this.resolvePath(
			process.cwd(),
			'build',
			'__tests__',
			'/testDirsAndFiles/',
			`${new Date().getTime()}`
		)
		const source = this.resolvePath(
			process.cwd(),
			'build',
			'__tests__',
			'/testDirsAndFiles/',
			testDirName
		)

		await diskUtil.copyDir(source, destination)
		return destination
	}
}
