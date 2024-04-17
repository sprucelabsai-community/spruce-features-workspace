import { StoreName, StoreOptions } from '@sprucelabs/data-stores'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'
import {
    AbstractSpruceFixtureTest,
    StoreFixture,
} from '@sprucelabs/spruce-test-fixtures'

export default abstract class AbstractStoreTest extends AbstractSpruceFixtureTest {
    protected static storeDir: string = diskUtil.resolvePath(
        process.cwd(),
        'build'
    )
    private static storeFixture: StoreFixture | null = null

    protected static async beforeEach() {
        await super.beforeEach()
        this.storeFixture = null
    }

    protected static async connectToDatabase() {
        return this.Fixture('database').connectToDatabase()
    }

    protected static async Store<
        N extends StoreName,
        O extends StoreOptions<N>,
    >(name: N, options?: O) {
        const fixture = this.getStoreFixture()
        return fixture.Store(name, options)
    }

    private static getStoreFixture() {
        if (!this.storeFixture) {
            this.storeFixture = new StoreFixture()
        }

        return this.storeFixture
    }

    protected static async getStore(name: StoreName) {
        return this.getStoreFixture().getStore(name)
    }
}
