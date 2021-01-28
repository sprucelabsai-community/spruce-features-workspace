import { CoreEventContract } from '@sprucelabs/mercury-types'
import { SchemaValues } from '@sprucelabs/schema'
import SpruceError from '../errors/SpruceError'
import {
	LoadedTopicDefinition,
	Message,
	SendMessageHandler,
} from '../types/conversation.types'
import TopicLoader from './TopicLoader'
import { TopicScriptPlayer } from './TopicScriptPlayer'
import { TopicSuggester } from './TopicSuggester'

type MessageResponsePayloadSchema = CoreEventContract['eventSignatures']['did-message::v2020_12_25']['responsePayloadSchema']
type MessageResponsePayload = SchemaValues<MessageResponsePayloadSchema>

export class ConversationCoordinator {
	private suggester: TopicSuggester
	private sendMessageHandler: SendMessageHandler
	private topics: LoadedTopicDefinition[]

	private constructor(options: {
		suggester: TopicSuggester
		sendMessageHandler: SendMessageHandler
		topics: LoadedTopicDefinition[]
	}) {
		this.suggester = options.suggester
		this.sendMessageHandler = options.sendMessageHandler
		this.topics = options.topics
	}

	public static async Coordinator(options: {
		topicLookupPath: string
		sendMessageHandler: SendMessageHandler
	}) {
		const topics = await TopicLoader.loadTopics(options.topicLookupPath)
		const suggester = await TopicSuggester.Suggester({ topics })

		return new ConversationCoordinator({
			suggester,
			sendMessageHandler: options.sendMessageHandler,
			topics,
		})
	}

	public async handleMessage(
		message: Message,
		topic?: string
	): Promise<MessageResponsePayload | void> {
		if (!message.source.personId) {
			throw new SpruceError({
				code: 'MISSING_PARAMETERS',
				parameters: ['source.personId'],
			})
		}

		if (!topic) {
			const suggestions = await this.suggester.suggest(message.body)

			return {
				suggestedTopics: suggestions,
			}
		}

		const matchedTopic = this.topics.find((t) => t.key === topic)

		if (!matchedTopic) {
			throw new SpruceError({
				code: 'TOPIC_NOT_FOUND',
				suppliedTopic: topic,
				validTopics: this.topics.map((t) => t.key),
			})
		}

		const { ...target } = message.source
		delete target.isCore

		const player = new TopicScriptPlayer({
			target,
			sendMessageHandler: this.sendMessageHandler,
			script: matchedTopic.script,
		})

		const results = await player.handleMessage(message)

		if (results) {
			return results
		}
	}
}
