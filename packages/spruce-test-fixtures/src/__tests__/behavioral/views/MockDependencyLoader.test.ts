import { TrustedDependency } from '@sprucelabs/heartwood-view-controllers'
import { test, assert, generateId } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import FakeDependencyLoader from '../../../tests/FakeDependencyLoader'

export default class MockDependencyLoaderTest extends AbstractSpruceFixtureTest {
    private static loader: FakeDependencyLoader

    protected static async beforeEach() {
        await super.beforeEach()
        this.loader = FakeDependencyLoader.Loader()
    }

    @test()
    protected static async throwsIfDependencyIsNotTrusted() {
        await assert.doesThrowAsync(() =>
            this.loader.load(generateId() as TrustedDependency)
        )
    }

    @test()
    protected static async canGetTrustedDependency() {
        this.registerDependency()
        await this.load()
    }

    @test()
    protected static async canRegisterAndGetFakedDependency() {
        const dependency = this.registerDependency()
        const loadedDependency = await this.load()
        assert.isEqual(
            loadedDependency,
            dependency,
            'Did not get registered dependency'
        )
    }

    @test()
    protected static async throwsIfDependencyHasNotBeenRegistered() {
        await assert.doesThrowAsync(() => this.load())
    }

    private static registerDependency() {
        const dependency = { foo: 'bar' }
        this.loader.registerDependency('@zoom/videosdk', dependency)
        return dependency
    }

    private static async load() {
        return await this.loader.load('@zoom/videosdk')
    }
}
