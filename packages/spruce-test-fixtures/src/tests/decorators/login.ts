import { MercuryClientFactory, MercuryClient } from '@sprucelabs/mercury-client'
import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { assert, SpruceTestResolver } from '@sprucelabs/test-utils'
import { MercuryFixture, ViewFixture } from '../..'
import FakerTracker from '../../FakerTracker'

type Client = MercuryClient

export default function login(phone: string) {
    return function (Class: any) {
        assert.isFunction(
            Class.Fixture,
            `You can only @login if your test extends AbstractSpruceFixtureTest`
        )

        MercuryFixture.setShouldAutomaticallyClearDefaultClient(false)
        ViewFixture.setShouldAutomaticallyResetAuth(false)

        let proxyGenerator: any

        SpruceTestResolver.onWillCallBeforeAll(async () => {
            MercuryClientFactory.setIsTestMode(true)
        })

        let client: MercuryClient | undefined

        SpruceTestResolver.onDidCallBeforeAll(async () => {
            const viewFixture = FakerTracker.getFixtures(Class.cwd).views
            const { client: c, person } =
                await viewFixture.loginAsDemoPerson(phone)

            client = c

            proxyGenerator = viewFixture.getProxyTokenGenerator()

            //@ts-ignore
            login.loggedInPerson = person

            MercuryFixture.setDefaultClient(client)
            ViewFixture.lockProxyCacheForPerson(person.id)

            await emitDidLogin(client)
        })

        SpruceTestResolver.onWillCallBeforeEach(async () => {
            MercuryFixture.setDefaultContractToLocalEventsIfExist(Class.cwd)
            FakerTracker.getFixtures(Class.cwd).views.setProxyTokenGenerator(
                proxyGenerator
            )
        })

        SpruceTestResolver.onWillCallAfterAll(async () => {
            await emitWillLogout(client)
        })

        SpruceTestResolver.onDidCallAfterAll(async () => {
            await client?.disconnect()
        })
    }
}

login.getClient = (): Client => {
    const client = MercuryFixture.getDefaultClient()
    assert.isTruthy(
        client,
        `You must @login() on your test class before getting the client!`
    )

    return client as any
}

login.getPerson = (): SpruceSchemas.Spruce.v2020_07_22.Person => {
    assert.isTruthy(
        //@ts-ignore
        login.loggedInPerson,
        `You must @login() on your test class before getting the person`
    )

    //@ts-ignore
    return login.loggedInPerson
}

login.on = async (
    name: 'did-login' | 'will-logout',
    cb: (options: {
        client: Client
        person: SpruceSchemas.Spruce.v2020_07_22.Person
    }) => Promise<void> | void
) => {
    //@ts-ignore
    if (!login.listeners) {
        //@ts-ignore
        login.listeners = {}
    }

    //@ts-ignore
    login.listeners[name] = cb
}

async function emitDidLogin(client: any) {
    //@ts-ignore
    let didLogin = login?.listeners?.['did-login']

    if (didLogin) {
        await didLogin(client)
    }
}

async function emitWillLogout(client: any) {
    //@ts-ignore
    let willLogout = login?.listeners?.['will-logout']

    if (willLogout) {
        await willLogout(client)
    }
}
