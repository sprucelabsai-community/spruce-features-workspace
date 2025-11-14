import {
    DependencyLoader,
    TrustedDependency,
} from '@sprucelabs/heartwood-view-controllers'
import { assert } from '@sprucelabs/test-utils'

export default class FakeDependencyLoader implements DependencyLoader {
    private fakedDependency?: unknown
    private constructor() {}

    public static Loader(): FakeDependencyLoader {
        return new this()
    }

    public async load<T>(dependency: TrustedDependency): Promise<T> {
        assert.isEqual(
            dependency,
            '@zoom/videosdk',
            `Attempted to load untrusted dependency: ${dependency}. Trusted dependencies are limited to '@zoom/videosdk'.`
        )

        assert.isTruthy(
            this.fakedDependency,
            `No faked dependency registered for: ${dependency}. Did you forget to call dependencyLoader.registerDependency()?`
        )
        return this.fakedDependency as T
    }

    public registerDependency(_name: TrustedDependency, dependency: unknown) {
        this.fakedDependency = dependency
    }
}
