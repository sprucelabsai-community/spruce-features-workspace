import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import { TopicSuggester } from '../../topics/TopicSuggester'

export default class TopicSuggesterTest extends AbstractSpruceTest {
    @test()
    protected static async canCreateTopicSuggester() {
        const topicSuggester = await TopicSuggester.Suggester({ topics: [] })
        assert.isTruthy(topicSuggester)
    }

    @test()
    protected static async canReturnOnlyTopic() {
        const topics = [
            {
                key: 'bookAppointment',
                label: 'Book an appointment',
                utterances: ['book an appointment'],
            },
        ]
        const messageBody = 'book'

        const suggestions = await this.Suggester(topics, messageBody)

        assert.doesInclude(suggestions[0], {
            key: 'bookAppointment',
            label: 'Book an appointment',
        })

        assert.isAbove(suggestions[0].confidence, 0)
    }

    @test()
    protected static async makeSureTopicsAreReturnedInOrderOfConfidence() {
        const suggestions = await this.Suggester(
            [
                {
                    key: 'scheduleShft',
                    label: 'Shift',
                    utterances: [
                        'shift',
                        'block my time',
                        'break',
                        'hours',
                        'schedule',
                    ],
                },
                {
                    key: 'bookAppointment',
                    label: 'Book',
                    utterances: [
                        'book appointment',
                        'schedule an appointment',
                        'book',
                        'schedule',
                    ],
                },
            ],
            "I'd like to schedule a haircut"
        )

        assert.isLength(suggestions, 2)
        assert.isEqualDeep(suggestions[0].key, 'bookAppointment')
    }

    @test('matches regardless "Experience "', 'Experience ', 'contactUs')
    @test(
        'matches regardless "Tell me about experience"',
        'Tell me about experience ',
        'contactUs'
    )
    @test(
        'matches "Tell me something funny"',
        'Tell me something funny',
        'jokes'
    )
    @test('matches "Joke me"', 'Joke me', 'jokes')
    @test('matches "Joke me"', 'Joke me', 'jokes')
    protected static async matchTests(
        phrase: string,
        expectedSuggestionKey: string
    ) {
        const suggestions = await this.Suggester(
            [
                {
                    key: 'contactUs',
                    label: 'Contact',
                    utterances: [
                        'tell me more',
                        'experience',
                        'experience management',
                        'tell me about experience',
                        'I want to know more',
                    ],
                },
                {
                    key: 'jokes',
                    label: 'Jokes',
                    utterances: [
                        'be funny',
                        'tell me a joke',
                        'tell me something funny',
                        'laugh',
                        'funny',
                        'make me laugh',
                        'robot jokes',
                    ],
                },
            ],
            phrase
        )

        assert.isLength(suggestions, 2)
        assert.isEqualDeep(suggestions[0].key, expectedSuggestionKey)
        assert.isAbove(suggestions[0].confidence, 0.8)
    }

    private static async Suggester(
        topics: { key: string; label: string; utterances: string[] }[],
        messageBody: string
    ) {
        const topicSuggester = await TopicSuggester.Suggester({
            topics,
        })

        const suggestions = await topicSuggester.suggest(messageBody)

        return suggestions
    }
}
