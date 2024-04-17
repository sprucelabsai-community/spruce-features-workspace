import { CardViewControllerImpl } from '@sprucelabs/heartwood-view-controllers'
import { AddressFieldValue } from '@sprucelabs/schema'
import { test, assert } from '@sprucelabs/test-utils'
import { generateId } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../../tests/AbstractSpruceFixtureTest'
import spyMapUtil from '../../../utilities/SpyMapUtil'

class SpyCard extends CardViewControllerImpl {
    public getMaps() {
        return this.maps
    }
}

export default class SpyingMapUtilTest extends AbstractSpruceFixtureTest {
    protected static async beforeEach() {
        await super.beforeEach()

        this.views = this.Fixture('view', {
            controllerMap: {
                spy: SpyCard,
            },
        })
    }

    @test()
    protected static async canCreateSpyingMapUtil() {
        assert.isTruthy(spyMapUtil)
    }

    @test()
    protected static async dropsIntoViewFixture() {
        assert.isEqual(this.maps, spyMapUtil)
    }

    @test()
    protected static async dropsSpyIntoVc() {
        const vc = this.views.Controller('spy' as any, {}) as SpyCard
        assert.isEqual(vc.getMaps(), this.maps)
    }

    @test()
    protected static async redirectingIsTracked() {
        const address: AddressFieldValue = {
            city: generateId(),
            country: generateId(),
            province: generateId(),
            street1: generateId(),
            street2: generateId(),
            zip: generateId(),
        }

        this.maps.openNavigation({ to: address })
        assert.isEqualDeep(this.maps.lastOpenNavigationOptions?.to, address)
    }

    @test()
    protected static async resetsLastOpenNavBetweenTests() {
        assert.isFalsy(this.maps.lastOpenNavigationOptions)
    }

    private static get maps() {
        return this.views.getMaps()
    }
}
