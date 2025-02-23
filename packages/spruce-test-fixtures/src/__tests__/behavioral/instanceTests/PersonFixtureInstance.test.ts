import {
    MercuryClientFactory,
    MercuryTestClient,
} from '@sprucelabs/mercury-client'
import { formatPhoneNumber } from '@sprucelabs/schema'
import AbstractSpruceTest, { test, assert, suite } from '@sprucelabs/test-utils'
import { errorAssert } from '@sprucelabs/test-utils'
import dotenv from 'dotenv'
import {
    DEMO_NUMBER,
    DEMO_NUMBER_SECOND_LOGIN,
    DEMO_NUMBER_PERSON_FIXTURE,
} from '../../../tests/constants'
import FixtureFactory from '../../../tests/fixtures/FixtureFactory'
import MercuryFixture from '../../../tests/fixtures/MercuryFixture'
import PersonFixture from '../../../tests/fixtures/PersonFixture'
dotenv.config()

MercuryFixture.setShouldRequireLocalListeners(false)

@suite()
export default class PersonFixtureTest extends AbstractSpruceTest {
    private fixture!: PersonFixture

    protected async beforeEach() {
        await super.beforeEach()

        this.fixture = this.Fixture()
        MercuryTestClient.reset()
    }

    private Fixture(): PersonFixture {
        return new FixtureFactory({ cwd: this.cwd }).Fixture('person')
    }

    @test()
    protected async canCreatePersonFixture() {
        assert.isTruthy(this.fixture)
    }

    @test()
    protected async throwsWhenNoDummyNumberSetInEnv() {
        delete process.env.DEMO_NUMBER

        const err = await assert.doesThrowAsync(() =>
            this.fixture.loginAsDemoPerson()
        )
        errorAssert.assertError(err, 'MISSING_PARAMETERS', {
            parameters: ['env.DEMO_NUMBER'],
        })
    }

    @test()
    protected async canLoginAsPerson() {
        const { person, client } =
            await this.fixture.loginAsDemoPerson(DEMO_NUMBER)

        assert.isTruthy(person)
        assert.isTruthy(client)

        await client.disconnect()
    }

    @test()
    protected async canLoginAsPersonWithEnv() {
        process.env.DEMO_NUMBER = DEMO_NUMBER
        const { person, client } = await this.fixture.loginAsDemoPerson()

        assert.isTruthy(person)
        assert.isEqual(person.phone, formatPhoneNumber(DEMO_NUMBER))
        assert.isTruthy(client)

        await client.disconnect()
    }

    @test()
    protected async canLoginWith2Numbers() {
        const { person } = await this.fixture.loginAsDemoPerson()

        const { person: person2 } = await this.fixture.loginAsDemoPerson(
            DEMO_NUMBER_SECOND_LOGIN
        )

        assert.isEqual(person.phone, formatPhoneNumber(DEMO_NUMBER))
        assert.isEqual(
            person2.phone,
            formatPhoneNumber(DEMO_NUMBER_SECOND_LOGIN)
        )
    }

    @test()
    protected async loggingInWithoutNumberReturnsSameClientEveryTime() {
        const { client } = await this.fixture.loginAsDemoPerson()

        const { client: client1 } = await this.fixture.loginAsDemoPerson()

        assert.isEqual(client, client1)
    }

    @test()
    protected async staysLoggedInAsThisPerson() {
        MercuryClientFactory.setIsTestMode(true)

        const { client } = await this.fixture.loginAsDemoPerson(
            DEMO_NUMBER_SECOND_LOGIN
        )

        //@ts-ignore
        client.emit = () => {
            assert.fail('should reuse client')
        }

        const { client: client1 } = await this.fixture.loginAsDemoPerson()

        assert.isEqual(client, client1)
    }

    @test()
    protected async canOverrideDefaultClient() {
        const { client } = await this.fixture.loginAsDemoPerson()

        MercuryFixture.setDefaultClient(client)

        const { client: client2 } = await this.fixture.loginAsDemoPerson(
            DEMO_NUMBER_SECOND_LOGIN
        )

        assert.isNotEqual(client, client2)
    }

    @test()
    protected async honorsDefaultClientEvenWithoutDemoPhoneSet() {
        const phone = process.env.DEMO_NUMBER
        delete process.env.DEMO_NUMBER

        const { client } = await this.Fixture().loginAsDemoPerson(phone)

        MercuryFixture.setDefaultClient(client)

        const { client: client2 } = await this.Fixture().loginAsDemoPerson()

        assert.isEqual(client, client2)
    }

    @test('list people passes target', {
        organizationId: '1234',
        locationId: '1234',
    })
    @test('list people passes target 2', {
        organizationId: '5234',
        locationId: '2666',
    })
    @test(
        'list people passes payload 1',
        {
            organizationId: '5234',
            locationId: '2666',
        },
        {
            personIds: ['56236'],
            roleBases: ['23452346'],
            roleIds: ['7567'],
            shouldIncludePrivateFields: false,
        }
    )
    protected async listPeoplePassesThroughVars(
        expectedTarget: any,
        expectedPayload = {
            personIds: ['1234'],
            roleBases: ['1234'],
            roleIds: ['1234'],
            shouldIncludePrivateFields: true,
        }
    ) {
        MercuryClientFactory.setIsTestMode(true)

        assert.isFunction(this.fixture.listPeople)
        const { client } = await this.fixture.loginAsDemoPerson(
            DEMO_NUMBER_PERSON_FIXTURE
        )

        let wasHit = true
        let passedTarget: any
        let passedPayload: any

        await client.on('list-people::v2020_12_25', ({ target, payload }) => {
            passedTarget = target
            passedPayload = payload
            wasHit = true
            return {
                people: [
                    {
                        id: '1234',
                        casualName: 'tay',
                        dateCreated: 0,
                    },
                ],
            }
        })

        await this.fixture.listPeople({
            ...expectedTarget,
            ...expectedPayload,
        })

        assert.isTrue(wasHit)
        assert.isEqualDeep(passedTarget, expectedTarget)
        assert.isEqualDeep(passedPayload, expectedPayload)
    }

    @test('returns people 1', [
        {
            id: '1234',
            casualName: 'tay',
            dateCreated: 0,
        },
    ])
    @test('returns people 2', [
        {
            id: '234234',
            casualName: 'tsaoteuh',
            dateCreated: 230,
        },
        {
            id: '1234',
            casualName: 'tay',
            dateCreated: 0,
        },
    ])
    protected async listPeopleReturnsPeople(expectedPeople: any) {
        MercuryClientFactory.setIsTestMode(true)
        const { client } = await this.fixture.loginAsDemoPerson(
            DEMO_NUMBER_PERSON_FIXTURE
        )

        await client.on('list-people::v2020_12_25', () => {
            return {
                people: expectedPeople,
            }
        })

        const people = await this.fixture.listPeople({
            organizationId: '1234',
        })

        assert.isEqualDeep(people, expectedPeople)
    }
}
