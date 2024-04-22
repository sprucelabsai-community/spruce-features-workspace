import { EventFeature } from '@sprucelabs/spruce-event-plugin'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { MercuryFixture } from '@sprucelabs/spruce-test-fixtures'
import { test, assert, generateId } from '@sprucelabs/test-utils'
import { errorAssert } from '@sprucelabs/test-utils'
import plugin, { ConversationFeature } from '../../plugins/conversation.plugin'
import AbstractConversationTest from '../../tests/AbstractConversationTest'

MercuryFixture.setShouldRequireLocalListeners(false)

export default class RegisteringConversationsOnBootTest extends AbstractConversationTest {
    @test()
    protected static async throwsWhenExecutingIfEventPluginMissing() {
        const skill = await this.Skill({ plugins: [plugin] })
        const err = await assert.doesThrowAsync(() => skill.execute())

        errorAssert.assertError(err, 'MISSING_DEPENDENCIES', {
            dependencies: ['event.plugin'],
        })
    }

    @test()
    protected static async noConvosToStart() {
        this.cwd = this.resolveTestPath('empty-skill')
        const { topics } = await this.registerAndBoot()
        assert.isLength(topics, 0)
    }

    @test()
    protected static async registersConvosOnBoot() {
        this.cwd = this.resolveTestPath('skill')
        const { topics } = await this.registerAndBoot()
        this.assertExpectedTopics(topics)
    }

    @test()
    protected static async skillShutsDownWhenConvosFailToRegister() {
        const { skill } = await super.bootSkill({
            shouldSuppressBootErrors: true,
        })

        assert.isFalse(skill.isRunning())
        this.clearSkillBootErrors()
    }

    @test()
    protected static async canBootASecondTime() {
        this.cwd = this.resolveTestPath('skill')

        const { topics } = await this.registerAndBoot()

        this.assertExpectedTopics(topics)

        const { topics: topics2 } = await this.registerAndBoot({
            skillId: process.env.SKILL_ID as string,
            apiKey: process.env.SKILL_API_KEY as string,
        })

        this.assertExpectedTopics(topics2)
    }

    @test()
    protected static async skillCanBootASecondTime() {
        this.cwd = this.resolveTestPath('skill')

        await this.registerAndBoot()

        await this.registerAndBoot({
            skillId: process.env.SKILL_ID as string,
            apiKey: process.env.SKILL_API_KEY as string,
        })
    }

    @test()
    protected static async coordinaterGetsSkillContext() {
        this.cwd = this.resolveTestPath('skill')

        const { skill, client } = await this.registerBootAndConnect()

        const id = generateId()
        await client.emitAndFlattenResponses('did-message::v2020_12_25', {
            payload: {
                message: this.buildMessage({
                    body: generateId(),
                    source: {
                        personId: id,
                    },
                }),
            },
        })

        const conversations = skill.getFeatureByCode(
            'conversation'
        ) as ConversationFeature

        //@ts-ignore
        const coordinator = await conversations.coordinatorsBySource[id]
        assert.isTruthy(coordinator)

        //@ts-ignore
        skill.updateContext('hello', 'world')
        assert.isEqualDeep(coordinator.getContext(), { hello: 'world' })

        //@ts-ignore
        skill.updateContext('hello2', 'world2')
        assert.isEqualDeep(coordinator.getContext(), {
            hello: 'world',
            hello2: 'world2',
        })
    }

    private static async registerBootAndConnect() {
        const { skill } = await this.registerAndBoot()
        const events = skill.getFeatureByCode('event') as EventFeature
        const client = await events.connectToApi()

        return { skill, client }
    }

    private static assertExpectedTopics(topics: any) {
        assert.isLength(topics, 5)

        assert.doesInclude(topics, { key: 'bookAppointment' })
        assert.doesInclude(topics, { key: 'cancelAppointment' })
        assert.doesInclude(topics, { key: 'favoriteColor' })
        assert.doesInclude(topics, { key: 'favoriteColorTopicChanger' })
        assert.doesInclude(topics, { key: 'mixedStringsAndCallbacks' })
    }

    private static async registerAndBoot(options?: {
        skillId: string
        apiKey: string
    }) {
        if (options?.skillId) {
            process.env.SKILL_ID = options.skillId
            process.env.SKILL_API_KEY = options.apiKey
        } else {
            const registeredSkill = await this.Fixture('skill').seedDemoSkill({
                name: 'my great skill',
            })

            process.env.SKILL_ID = registeredSkill.id
            process.env.SKILL_API_KEY = registeredSkill.apiKey
        }

        const { skill } = await this.bootSkill()

        const eventFeature = skill.getFeatureByCode('event') as EventFeature

        const client = await eventFeature.connectToApi()

        let topics: any

        const results = await client.emit(
            'get-conversation-topics::v2020_12_25'
        )
        const payload = eventResponseUtil.getFirstResponseOrThrow(results)

        topics = payload.topics

        return { topics, skill }
    }
}
