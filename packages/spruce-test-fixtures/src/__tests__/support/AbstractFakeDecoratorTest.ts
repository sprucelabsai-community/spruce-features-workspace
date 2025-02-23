import { assert, TestLifecycleListeners } from '@sprucelabs/test-utils'
import AbstractSpruceFixtureTest from '../../tests/AbstractSpruceFixtureTest'
import { DEMO_NUMBER } from '../../tests/constants'
import fake from '../../tests/decorators/fake'

export default class AbstractFakeDecoratorTest extends AbstractSpruceFixtureTest {
    protected static async fakeLoginAndGetAuth(phone: string = DEMO_NUMBER) {
        await this.fakeLogin(phone)

        const { client, person } = await this.people.loginAsDemoPerson()

        const [{ auth, type }] = await client.emitAndFlattenResponses(
            'whoami::v2020_12_25'
        )

        assert.isEqual(type, 'authenticated')
        assert.isEqualDeep(auth.person, this.fakedPerson)
        assert.isEqualDeep(person, this.fakedPerson)

        return auth
    }

    protected static async fakeLogin(number: string = DEMO_NUMBER) {
        const decorator = fake.login(number)

        TestLifecycleListeners.willBeforeAllListeners = []
        TestLifecycleListeners.didBeforeAllListeners = []
        TestLifecycleListeners.willBeforeEachListeners = []
        TestLifecycleListeners.didBeforeEachListeners = []

        decorator(this as any, false)

        await TestLifecycleListeners.emitWillRunBeforeAll()
        await TestLifecycleListeners.emitDidRunBeforeAll()

        await TestLifecycleListeners.emitWillRunBeforeEach()
        await TestLifecycleListeners.emitDidRunBeforeEach()
    }
}
