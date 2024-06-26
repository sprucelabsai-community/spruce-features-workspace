import { EventContract } from '@sprucelabs/mercury-types'
import {
    eventContractUtil,
    eventResponseUtil,
} from '@sprucelabs/spruce-event-utils'
import {
    eventFaker,
    fake,
    MercuryFixture,
} from '@sprucelabs/spruce-test-fixtures'
import { assert, test } from '@sprucelabs/test-utils'
import { EventFeaturePlugin } from '../../../plugins/event.plugin'
import AbstractEventPluginTest from '../../../tests/AbstractEventPluginTest'

MercuryFixture.setShouldAutoImportContracts(false)

@fake.login()
export default class RegisteringEventsOnBootTest extends AbstractEventPluginTest {
    private static eventContracts: EventContract[] = []
    private static namespaceForRegisteringEvents = ''

    protected static async beforeEach(): Promise<void> {
        await super.beforeEach()

        await eventFaker.on(
            'sync-event-contracts::v2020_12_25',
            ({ payload }) => {
                const namespaced = { eventSignatures: {} }
                Object.keys(payload.contract.eventSignatures).forEach(
                    (name) => {
                        //@ts-ignore
                        namespaced.eventSignatures[
                            `${this.namespaceForRegisteringEvents}.${name}`
                        ] = payload.contract.eventSignatures[name]
                    }
                )
                this.eventContracts.push(namespaced)

                return {
                    fqens: Object.keys(namespaced.eventSignatures),
                }
            }
        )

        await eventFaker.on('get-event-contracts::v2020_12_25', () => {
            return {
                contracts: this.eventContracts,
            }
        })

        this.eventContracts = [
            {
                eventSignatures: {},
            },
        ]
    }

    @test()
    protected static async noEventsRegisteredWhenNoEventsCreated() {
        this.cwd = await this.generateSkillFromTestPath('empty-skill')

        const { contracts, currentSkill: currentSkill } =
            await this.register2SkillsInstallAtOrgAndBootSkill()
        assert.isFalse(this.doesIncudeEventBySkill(contracts, currentSkill))
    }

    @test()
    protected static async badMercuryUrlCrashesSkillAsExpected() {
        process.env.HOST = 'aoeu'
        await assert.doesThrowAsync(() => this.bootSkill())
    }

    @test()
    protected static async registersEventsOnBoot() {
        this.cwd = await this.generateSkillFromTestPath('skill')

        const { contracts, currentSkill: currentSkill } =
            await this.register2SkillsInstallAtOrgAndBootSkill(
                async (skill) => {
                    this.generateGoodContractFileForSkill(skill)
                }
            )

        assert.isTrue(
            this.doesIncudeEventBySkill(contracts, currentSkill),
            'Event contract missing event registered by current skill'
        )
    }

    @test('will register listeners if env is not set', undefined, 4)
    @test('wont re-register listeners if env is set', 'true', 2)
    protected static async wontRegisterTheSecondTimeBecauseFilesHaveNotChanged(
        shouldCache: string | undefined,
        expectedRegisterCount: number
    ) {
        process.env.SHOULD_CACHE_EVENT_REGISTRATIONS = shouldCache
        const currentSkill = await this.registerCurrentSkill()
        this.generateGoodContractFileForSkill(currentSkill)

        const client = await this.Fixture('mercury').connectToApi()

        let registerEventCount = 0
        await client.on('sync-event-contracts::v2020_12_25', async () => {
            registerEventCount++
            return { fqens: ['empty'] }
        })

        await Promise.all([
            this.bootSkill(),
            this.bootSkill(),
            this.bootSkill(),
        ])

        this.generateGoodContractFileForSkill(currentSkill)
        await this.bootSkill()

        assert.isEqual(registerEventCount, expectedRegisterCount)
    }

    @test()
    protected static async canBootSkill20TimesAtOnce() {
        const currentSkill = await this.registerCurrentSkill()
        this.generateGoodContractFileForSkill(currentSkill)

        const promises = Array(20)
            .fill(0)
            .map(() => {
                return this.bootSkill()
            })

        await Promise.all(promises)
    }

    @test()
    protected static async defaultConnectionRetriesIsALot() {
        delete process.env.MERCURY_CONNECTION_RETRIES
        await this.assertConnectionRetriesEquals(9999)
    }

    @test('uses connection retries from env 1', 123)
    @test('uses connection retries from env 2', 535)
    protected static async usesConnectionRetriesFromEnv(expected: number) {
        process.env.MERCURY_CONNECTION_RETRIES = `${expected}`
        await this.assertConnectionRetriesEquals(expected)
    }

    @test()
    protected static async mercuryConnectionRetriesStartsAtExpected() {
        assert.isEqual(process.env.MERCURY_CONNECTION_RETRIES, '10')
    }

    @test()
    protected static async waitsForFirstPrereqBeforeSyncingEvents() {
        const { events, skill } =
            await this.bootSkillWithContractAndGetEventPlugin()

        let wasHit = false
        await eventFaker.on('sync-event-contracts::v2020_12_25', () => {
            wasHit = true
            return {
                fqens: ['test'],
            }
        })

        const resolve = this.addPreReq(events)

        const skillPromise = this.bootSkill({
            skill,
        })

        assert.isFalse(wasHit)

        resolve()

        await skillPromise

        assert.isTrue(wasHit)
    }

    @test()
    protected static async canWaitForMoreThanOnePreReq() {
        const { events, skill } =
            await this.bootSkillWithContractAndGetEventPlugin()

        let wasHit = false
        await eventFaker.on('sync-event-contracts::v2020_12_25', () => {
            wasHit = true
            return {
                fqens: ['test'],
            }
        })

        const resolve1 = this.addPreReq(events)
        const resolve2 = this.addPreReq(events)

        const skillPromise = this.bootSkill({
            skill,
        })

        assert.isFalse(wasHit)
        resolve2()
        await this.wait(100)
        assert.isFalse(wasHit)
        resolve1()
        await this.wait(100)
        assert.isTrue(wasHit)
        await skillPromise
    }

    private static addPreReq(events: any) {
        let resolve: Resolve = () => {}
        const promise = new Promise((r) => {
            resolve = r as Resolve
        })

        events.addPreReq(promise)
        return resolve!
    }

    private static async bootSkillWithContractAndGetEventPlugin() {
        const currentSkill = await this.registerCurrentSkill()
        this.generateGoodContractFileForSkill(currentSkill)

        const skill = await this.Skill()
        const events = skill.getFeatureByCode('event') as EventFeaturePlugin
        return { events, skill }
    }

    private static async assertConnectionRetriesEquals(expected: number) {
        const client = await this.connectToApi()
        //@ts-ignore
        assert.isEqual(client.connectionRetries, expected)
    }

    private static async connectToApi() {
        const event = await this.bootAndGetEventFeature()
        const client = await event.connectToApi()
        return client
    }

    private static async bootAndGetEventFeature() {
        const { skill } = await this.bootSkill()
        const event = skill.getFeatureByCode('event') as EventFeaturePlugin
        return event
    }

    private static doesIncudeEventBySkill(
        contracts: any,
        registeredSkill: any
    ) {
        const unified = eventContractUtil.unifyContracts(contracts)
        const names = eventContractUtil.getEventNames(
            unified ?? { eventSignatures: {} },
            registeredSkill.slug
        )

        return names.length > 0
    }

    private static async register2SkillsInstallAtOrgAndBootSkill(
        afterRegisterSkillHandler?: (skill: any) => Promise<void>
    ) {
        const currentSkill = await this.registerCurrentSkill()

        await afterRegisterSkillHandler?.(currentSkill)

        this.namespaceForRegisteringEvents = currentSkill.slug
        await this.bootSkill()

        const orgs = this.Fixture('organization')

        const [{ skill: skill2, client }, org] = await Promise.all([
            await this.Fixture('skill').loginAsDemoSkill({
                name: 'a killer skill',
            }),
            await orgs.seedDemoOrganization({ name: 'my new org' }),
        ])

        await Promise.all([
            orgs.installSkill(currentSkill.id, org.id),
            orgs.installSkill(skill2.id, org.id),
        ])

        const results = await client.emit('get-event-contracts::v2020_12_25')

        const payload = eventResponseUtil.getFirstResponseOrThrow(results)
        const contracts = payload.contracts

        return { contracts, currentSkill, skill2 }
    }
}

type Resolve = () => void
