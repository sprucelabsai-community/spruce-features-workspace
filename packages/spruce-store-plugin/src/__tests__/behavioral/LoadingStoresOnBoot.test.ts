import { StoreLoader } from '@sprucelabs/data-stores'
import { test, assert, generateId } from '@sprucelabs/test-utils'
import { errorAssert } from '@sprucelabs/test-utils'
import { StoreFeaturePlugin } from '../../plugins/store.plugin'
import AbstractStorePluginTest from '../../tests/AbstractStorePluginTest'

export default class LoadingStoresOnBootTest extends AbstractStorePluginTest {
    protected static async beforeEach(): Promise<void> {
        await super.beforeEach()
        delete process.env.DB_ADAPTER
    }

    @test()
    protected static async throwsWhenLoadingImproperlyImplementedStore() {
        this.setCwd('one-bad-store-skill')

        await this.bootSkill({ shouldSuppressBootErrors: true })

        assert.isTruthy(this.skillBootError)

        errorAssert.assertError(this.skillBootError, 'FAILED_TO_LOAD_STORE', {
            name: 'Bad',
        })

        this.clearSkillBootErrors()
    }

    @test()
    protected static async throwsIfJustOneStoreIsBad() {
        this.setCwd('one-good-one-bad-store-skill')
        await this.bootSkill({ shouldSuppressBootErrors: true })
        assert.isTruthy(this.skillBootError)

        errorAssert.assertError(this.skillBootError, 'FAILED_TO_LOAD_STORE', {
            name: 'Bad',
        })

        this.clearSkillBootErrors()
    }

    @test()
    protected static async throwsIfMissingConnectionString() {
        delete process.env.DB_CONNECTION_STRING

        this.setCwd('one-good-store-skill')
        await this.bootSkill({ shouldSuppressBootErrors: true })

        assert.isTruthy(this.skillBootError)

        errorAssert.assertError(this.skillBootError, 'MISSING_PARAMETERS', {
            parameters: ['env.DB_CONNECTION_STRING'],
        })

        this.clearSkillBootErrors()
    }

    @test()
    protected static async canGetStoreFactory() {
        this.setCwd('one-good-store-skill')

        const { skill } = await this.bootSkill({
            shouldSuppressBootErrors: true,
        })
        const stores = skill.getFeatureByCode('store') as StoreFeaturePlugin

        const factory = stores.getFactory()
        assert.isTruthy(factory)
    }

    @test()
    protected static async canGetStoreFromStoreFactory() {
        this.setCwd('one-good-store-skill')
        const { skill } = await this.bootSkill({
            shouldSuppressBootErrors: true,
        })
        const stores = skill.getFeatureByCode('store') as StoreFeaturePlugin

        const factory = stores.getFactory()

        //@ts-ignore
        const store = (await factory.Store('good')) as any
        assert.isTruthy(store)

        const OneGoodStore =
            require('../testDirsAndFiles/one-good-store-skill/build/stores/Good.store').default
        assert.isTrue(store instanceof OneGoodStore)
    }

    @test()
    protected static async usesSharedStoreLoaderInstance() {
        this.setCwd('one-good-store-skill')

        const db = await this.connectToDatabase()
        const loader = await StoreLoader.getInstance(
            this.resolvePath('build'),
            db
        )

        loader.loadStoresAndErrors = () => {
            throw new Error('FAIL')
        }

        await this.bootSkill({ shouldSuppressBootErrors: true })

        assert.doesInclude(this.skillBootError?.message, 'FAIL')

        this.clearSkillBootErrors()
    }

    @test()
    protected static async throwsWithBadAdapterName() {
        process.env.DB_ADAPTER = generateId()

        this.setCwd('one-good-store-skill')
        await this.bootSkill({ shouldSuppressBootErrors: true })

        assert.isTruthy(this.skillBootError, 'Did not throw an error')
        errorAssert.assertError(
            this.skillBootError,
            'FAILED_TO_LOAD_DB_ADAPTER',
            {
                name: process.env.DB_ADAPTER,
            }
        )

        this.clearSkillBootErrors()
    }

    @test('can load custom adapter 1', 'adapter1')
    @test('can load custom adapter 2', 'adapter2')
    protected static async actuallyImportsDbAdapter(name: string) {
        const adapter = this.resolvePath(
            __dirname,
            '..',
            'testDirsAndFiles',
            name
        )

        process.env.DB_ADAPTER = adapter
        this.setCwd('one-good-store-skill')
        await this.bootSkill()

        assert.isEqual(process.env.ADAPTER_LOADED, name)
    }

    protected static setCwd(key: string) {
        this.cwd = this.resolvePath(
            __dirname,
            '..',
            '..',
            '__tests__',
            '/testDirsAndFiles/',
            key
        )
    }
}
