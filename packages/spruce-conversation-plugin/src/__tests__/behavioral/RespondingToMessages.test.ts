import { MercuryClient } from '@sprucelabs/mercury-client'
import { EventFeature } from '@sprucelabs/spruce-event-plugin'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { MercuryFixture } from '@sprucelabs/spruce-test-fixtures'
import { test, assert } from '@sprucelabs/test-utils'
import AbstractConversationTest from '../../tests/AbstractConversationTest'

MercuryFixture.setShouldRequireLocalListeners(false)

export default class RespondingToMessagesTest extends AbstractConversationTest {
    private static client: MercuryClient

    protected static async beforeEach() {
        await super.beforeEach()
        //@ts-ignore
        this.client = undefined
    }

    @test()
    protected static async respondsToFirstMessageWithSuggestedTopics() {
        this.cwd = this.resolveTestPath('skill')
        const results = await this.sendMessage()

        const { suggestedTopics } =
            eventResponseUtil.getFirstResponseOrThrow(results)

        assert.isArray(suggestedTopics)
        assert.isLength(suggestedTopics, 1)
    }

    @test()
    protected static async scriptSendsMessages() {
        this.cwd = this.resolveTestPath('skill')

        const sentMessages: any[] = []

        await this.boot()

        await this.client.on(
            'send-message::v2020_12_25',
            async (targetAndPayload) => {
                const { payload } = targetAndPayload
                sentMessages.push(payload.message)
                return { message: payload.message } as any
            }
        )

        await this.sendMessage({ topic: 'bookAppointment' })

        assert.isLength(sentMessages, 2)
    }

    @test()
    protected static async scriptCallbacksCanRespondToEventWithTransitionAndRepairs() {
        this.cwd = this.resolveTestPath('skill')

        await this.sendMessage({
            topic: 'favoriteColor',
            message: { body: 'favorite color' },
        })

        const results = await this.sendMessage({
            topic: 'favoriteColor',
            message: { body: 'blue' },
        })

        const { transitionConversationTo, repairs } =
            eventResponseUtil.getFirstResponseOrThrow(results)

        assert.isEqual(transitionConversationTo, 'discovery')
        assert.isEqualDeep(repairs, ['go', 'team'])
    }

    @test()
    protected static async scriptCallbacksCanRespondToEventWithTransitionAndTopicChangers() {
        this.cwd = this.resolveTestPath('skill')

        await this.sendMessage({
            topic: 'favoriteColorTopicChanger',
            message: { body: 'favorite color' },
        })

        const results = await this.sendMessage({
            topic: 'favoriteColorTopicChanger',
            message: { body: 'blue' },
        })

        const { transitionConversationTo, topicChangers } =
            eventResponseUtil.getFirstResponseOrThrow(results)

        assert.isEqual(transitionConversationTo, 'discovery')
        assert.isEqualDeep(topicChangers, ['now', 'this'])
    }

    @test()
    protected static async scriptCallbackGetsRandAndMessage() {
        this.cwd = this.resolveTestPath('skill-assertions')

        const results = await this.sendMessage({
            topic: 'assertsScriptCallbackOptions',
            message: { body: 'hello' },
        })

        eventResponseUtil.getFirstResponseOrThrow(results)
    }

    @test()
    protected static async eachPersonGetsTheirOwnConversation() {
        this.cwd = this.resolveTestPath('skill-assertions')

        await this.sendMessage({
            topic: 'assertsScriptOnlyCalledOnce',
            message: { body: 'hey hey', source: { personId: '234234234' } },
        })

        await this.sendMessage({
            topic: 'assertsScriptOnlyCalledOnce',
            message: { body: 'hey hey', source: { personId: '234234' } },
        })

        await this.sendMessage({
            topic: 'assertsScriptOnlyCalledOnce',
            message: { body: 'hey hey', source: { personId: '323' } },
        })
    }

    private static async sendMessage(options?: {
        message?: any
        topic?: string
    }) {
        const client = await this.boot()

        const results = await client.emit('did-message::v2020_12_25', {
            target: {},
            payload: {
                ...options,
                message: this.buildMessage({
                    body: 'I wanna book an appointment!',
                    source: {
                        isCore: null,
                        personId: '12345',
                    },
                    ...options?.message,
                }),
            },
        })

        return results
    }

    private static async boot() {
        if (!this.client) {
            const { skill } = await this.bootAndRegisterNewSkill({
                name: 'my skill yo',
            })

            const events = skill.getFeatureByCode('event') as EventFeature
            const client = await events.connectToApi()

            this.client = client
        }

        return this.client
    }
}
