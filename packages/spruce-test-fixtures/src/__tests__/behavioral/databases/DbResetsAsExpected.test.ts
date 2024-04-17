import { test, assert } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import seed from '../../../tests/decorators/seed'
import StoreFixture from '../../../tests/fixtures/StoreFixture'
// eslint-disable-next-line spruce/prohibit-import-from-build-folder
import GoodStore from '../../testDirsAndFiles/one-good-store-skill/build/stores/Good.store'

//do not seed anything else here, this test is to ensure db settings are reset before any
//seed is called

export default class DbResetsAsExpectedTest extends AbstractSpruceFixtureTest {
    @test()
    protected static shouldBeReset() {
        assert.isEqual(process.env.DB_NAME, 'memory')
        assert.isEqual(process.env.DB_CONNECTION_STRING, 'memory://')
    }

    @seed('good', 1)
    protected static doesNothing() {}
}

StoreFixture.setStore('good', GoodStore)
