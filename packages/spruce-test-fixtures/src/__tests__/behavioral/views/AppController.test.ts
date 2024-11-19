import { assert, test } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
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
        assert.isTruthy(App, 'App should have been returned')
        const app = new App({} as any)
        //@ts-ignore
        assert.isEqual(app.getOne(), 'applesauce')
    }

    @test()
    protected static async returnsActualApp2() {
        const App = this.loadApp(this.resolvePathToTestSkill('app2'))
        assert.isTruthy(App, 'App should have been returned')
        const app = new App({} as any)
        //@ts-ignore
        assert.isEqual(app.getTwo(), 'butter')
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
