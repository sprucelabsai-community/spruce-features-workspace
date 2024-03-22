import { vcPluginAssert } from '@sprucelabs/heartwood-view-controllers'
import { test, assert, generateId } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import FixtureFactory from '../../../tests/fixtures/FixtureFactory'
import vcDiskUtil from '../../../utilities/vcDisk.utility'
import RandomViewPlugin from '../../support/RandomViewPlugin'
import RandomViewPlugin2 from '../../support/RandomViewPlugin2'

export default class ViewPluginsTest extends AbstractSpruceFixtureTest {
	protected static async beforeEach(): Promise<void> {
		await super.beforeEach()
		process.env.RANDOM_VALUE = generateId()
	}

	@test()
	protected static async vcAssertLoadsControllersAndMapWithPlugnsByName() {
		const pluginsByName = await this.loadControllersAndMap('plugins1')
		assert.isTruthy(pluginsByName)
		assert.isTruthy(pluginsByName.test1)
	}

	@test(
		'can load test1 plugin from plugins1',
		'plugins1',
		'test1',
		RandomViewPlugin
	)
	@test(
		'can load test2 plugin from plugins2',
		'plugins2',
		'test2',
		RandomViewPlugin2
	)
	protected static async getsPluginWithExpectedClassReference(
		dirName: string,
		key: string,
		Expected: any
	) {
		const pluginsByName = await this.loadControllersAndMap(dirName)

		//@ts-ignore
		assert.isEqual(pluginsByName[key], Expected)
	}

	@test()
	protected static async doesNotIncludePluginsNotExported() {
		const pluginsByName = await this.loadControllersAndMap('plugins1')
		assert.isFalsy(pluginsByName.test2)
	}

	@test()
	protected static async passesPluginsToTheViewFactory() {
		const vc = this.VcWithPlugins('plugins1')
		vcPluginAssert.pluginIsInstalled(vc, 'test1', RandomViewPlugin)
		assert.doesThrow(() => vcPluginAssert.pluginIsInstalled(vc, 'test2'))
	}

	@test()
	protected static async loadsPluginsFromDifferentDirectory() {
		const vc = this.VcWithPlugins('plugins2')
		vcPluginAssert.pluginIsInstalled(vc, 'test2', RandomViewPlugin2)
		assert.doesThrow(() => vcPluginAssert.pluginIsInstalled(vc, 'test1'))
	}

	private static VcWithPlugins(dirName: string) {
		const fixture = new FixtureFactory({
			cwd: this.resolvePath(this.resolvePathToTestSkill(dirName), '..'),
			namespace: generateId(),
		})

		const views = fixture.Fixture('view')
		const factory = views.getFactory()
		const vc = factory.Controller('card', {})
		return vc
	}

	private static async loadControllersAndMap(dirName: string) {
		const toLoad = this.resolvePathToTestSkill(dirName)

		const { pluginsByName } = vcDiskUtil.loadViewControllersAndBuildMap(
			'test',
			toLoad
		)

		return pluginsByName
	}

	private static resolvePathToTestSkill(dirName: string) {
		return this.resolvePath(
			'build',
			'__tests__',
			'testDirsAndFiles',
			dirName,
			'build'
		)
	}
}
