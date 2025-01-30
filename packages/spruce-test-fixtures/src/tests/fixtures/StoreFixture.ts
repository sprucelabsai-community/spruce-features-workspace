import {
    CursorPagerFaker,
    DatabaseFixture,
    MockStoreFactory,
    StoreFactory,
    StoreLoader,
    StoreMap,
    StoreName,
    StoreOptions,
} from '@sprucelabs/data-stores'
import { diskUtil } from '@sprucelabs/spruce-skill-utils'

export default class StoreFixture {
    private static storeFactory?: Promise<StoreFactory>
    private loader?: Promise<StoreLoader>
    private static storeMap: Record<string, any> = {}
    private static shouldAutomaticallyResetDatabase = true

    public static setStore(name: StoreName, Class: any) {
        this.storeMap[name] = Class
    }

    public async getStore<N extends StoreName>(name: N) {
        const factory = await this.getStoreFactory()
        return factory.getStore(name)
    }

    public async Store<N extends StoreName, O extends StoreOptions<N>>(
        name: N,
        options?: O
    ): Promise<StoreMap[N]> {
        const factory = await this.getStoreFactory()
        return factory.Store(name, options)
    }

    private get storeFactory(): Promise<StoreFactory> | undefined {
        return StoreFixture.storeFactory
    }

    private set storeFactory(factory: Promise<StoreFactory>) {
        StoreFixture.storeFactory = factory
    }

    public async getStoreFactory() {
        if (!this.storeFactory) {
            if (!this.loader) {
                this.loader = StoreLoader.getInstance()
                await this.loader
            }
            const loader = await this.loader

            this.storeFactory = loader.loadStores()
        }

        const factory = await this.storeFactory

        Object.keys(StoreFixture.storeMap).forEach((name) => {
            factory.setStoreClass(
                name as StoreName,
                StoreFixture.storeMap[name]
            )
        })

        return factory as MockStoreFactory
    }

    public static setShouldAutomaticallyResetDatabase(shouldReset: boolean) {
        this.shouldAutomaticallyResetDatabase = shouldReset
    }

    public static async beforeAll() {
        const cwd = diskUtil.resolvePath(process.cwd(), 'build')

        StoreFactory.Class = MockStoreFactory
        StoreLoader.setStoreDir(cwd)
        DatabaseFixture.beforeAll()

        await this.setup()
    }

    public static async beforeEach() {
        if (this.shouldAutomaticallyResetDatabase) {
            await this.reset()
        }

        await CursorPagerFaker.beforeEach()
    }

    public static async reset() {
        this.storeFactory = undefined
        this.resetDbConnectionSettings()

        await DatabaseFixture.beforeEach()

        StoreFactory.reset()

        await this.setup()
    }

    public static resetDbConnectionSettings() {
        process.env.DB_NAME = 'memory'
        process.env.DB_CONNECTION_STRING = 'memory://'
    }

    private static async setup() {
        const db = await this.DatabaseFixture().connectToDatabase()

        StoreLoader.clearInstance()
        StoreLoader.setDatabase(db)
    }

    public static async afterEach() {
        await DatabaseFixture.afterEach()
    }

    public static DatabaseFixture() {
        return new DatabaseFixture()
    }
}
