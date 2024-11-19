import {
    AppController,
    AppControllerConstructor,
    AppControllerId,
} from '@sprucelabs/heartwood-view-controllers'
import { assert, generateId, test } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import FixtureFactory from '../../../tests/fixtures/FixtureFactory'
import vcDiskUtil from '../../../utilities/vcDisk.utility'

export default class AppControllerTest extends AbstractSpruceFixtureTest {
    @test()
    protected static async canReturnApp() {
        const App = this.app1()
        assert.isTruthy(App, 'App should have been returned')
    }

    @test()
    protected static async noAppIfNotInDirectoryWithApp() {
        const App = this.loadApp(this.resolvePathToTestSkill('skill'))
        assert.isFalsy(App, 'No App should have been returned')
    }

    @test()
    protected static async returnsActualApp1() {
        const App = this.app1()
        this.assertValidApp1(App)
    }

    @test()
    protected static async returnsActualApp2() {
        const App = this.loadApp(this.resolvePathToTestSkill('app2'))
        assert.isTruthy(App, 'App should have been returned')
        const app = new App({} as any)
        //@ts-ignore
        assert.isEqual(app.getTwo(), 'butter')
    }

    @test()
    protected static async viewFixtureGetsTheAppMixedIp() {
        const namespace = generateId() as AppControllerId
        const fixture = new FixtureFactory({
            cwd: this.resolvePath(this.resolvePathToTestSkill('app1'), '..'),
            namespace,
        })

        const views = fixture.Fixture('view')
        const app = views.App(namespace)
        this.assertIsApp1(app)
    }

    private static assertValidApp1(App?: AppControllerConstructor) {
        assert.isTruthy(App, 'App should have been returned')
        const app = new App({} as any)
        this.assertIsApp1(app)
    }

    private static assertIsApp1(app: AppController) {
        //@ts-ignore
        assert.isEqual(app.getOne(), 'applesauce')
    }

    private static app1() {
        return this.loadApp(this.resolvePathToTestSkill('app1'))
    }

    private static loadApp(path: string) {
        const { App } = vcDiskUtil.loadViewControllersAndBuildMap('test', path)
        return App
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
