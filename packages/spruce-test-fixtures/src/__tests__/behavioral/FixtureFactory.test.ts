import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import { errorAssert } from '@sprucelabs/test-utils'
import FixtureFactory from '../../tests/fixtures/FixtureFactory'
import MercuryFixture from '../../tests/fixtures/MercuryFixture'
import OrganizationFixture from '../../tests/fixtures/OrganizationFixture'
import PersonFixture from '../../tests/fixtures/PersonFixture'
import SkillFixture from '../../tests/fixtures/SkillFixture'
export default class FixtureFactoryTest extends AbstractSpruceTest {
    @test()
    protected static throwsWithBadFixture() {
        //@ts-ignore
        const err = assert.doesThrow(() => this.Fixture().Fixture('taco'))
        errorAssert.assertError(err, 'INVALID_FIXTURE', {
            suppliedName: 'taco',
        })
    }

    @test('person fixture', 'person', PersonFixture)
    @test('mercury fixture', 'mercury', MercuryFixture)
    @test('org fixture', 'organization', OrganizationFixture)
    @test('skill fixture', 'skill', SkillFixture)
    protected static getsFixture(name: string, Class: any) {
        //@ts-ignore
        const fixture = this.Fixture().Fixture(name)
        assert.isTrue(fixture instanceof Class)
    }

    private static Fixture() {
        return new FixtureFactory({ cwd: this.cwd })
    }

    @test()
    protected static async destroyDisconnectsClient() {
        const { client } = await this.Fixture()
            .Fixture('person')
            .loginAsDemoPerson()

        assert.isTrue(client.isConnected())

        await FixtureFactory.destroy()

        assert.isFalse(client.isConnected())
    }
}
