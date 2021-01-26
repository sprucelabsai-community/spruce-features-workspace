//@ts-ignore
import { containerBootstrap } from '@nlpjs/core'
//@ts-ignore
import { LangEn } from '@nlpjs/lang-en'
//@ts-ignore
import { NluManager, NluNeural } from '@nlpjs/nlu'
import { SuggestedConversationTopic, Topic } from '../types/conversation.types'

type NlpProcessor = (
	messageBody: string
) => Promise<{
	classifications: {
		score: number
		intent: string
	}[]
}>

export class TopicSuggester {
	private nlp: NlpProcessor
	private topics: Topic[]
	private minimumTopicSuggestionConfidenceThreshold: number

	private constructor(
		nlp: NlpProcessor,
		topics: Topic[],
		minimumTopicSuggestionConfidenceThreshold = 0.5
	) {
		this.nlp = nlp
		this.topics = topics
		this.minimumTopicSuggestionConfidenceThreshold = minimumTopicSuggestionConfidenceThreshold
	}

	public static async Suggester(options: {
		topics: Topic[]
		minimumTopicSuggestionConfidenceThreshold?: number
	}) {
		const container = containerBootstrap()
		container.use(LangEn)
		container.use(NluNeural)

		const manager = new NluManager({ container, locales: ['en'] })

		for (const topic of options.topics) {
			manager.assignDomain('en', topic.key, topic.key)
			for (const utterance of topic.utterances) {
				manager.add('en', utterance, topic.key)
			}
		}

		if (options.topics.length > 0) {
			await manager.train()
		}

		return new this(
			manager.process.bind(manager),
			options.topics,
			options.minimumTopicSuggestionConfidenceThreshold
		)
	}

	public async suggest(
		messageBody: string
	): Promise<SuggestedConversationTopic[]> {
		const { classifications } = await this.nlp(messageBody)

		const suggestedTopics: SuggestedConversationTopic[] = []

		for (const c of classifications) {
			const match = this.topics.find((t) => t.key === c.intent)

			if (match && c.score > this.minimumTopicSuggestionConfidenceThreshold) {
				suggestedTopics.push({
					key: match.key,
					label: match.label,
					confidence: c.score,
				})
			}
		}

		return suggestedTopics
	}
}
