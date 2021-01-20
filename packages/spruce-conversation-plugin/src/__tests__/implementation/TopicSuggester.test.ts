import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import { TopicSuggester } from '../../conversations/TopicSuggester'

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
					utterances: ['shift', 'block my time', 'break', 'hours', 'schedule'],
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
