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
	private player?: TopicScriptPlayer
	private lastTopic?: string
	private lineDelay?: number

	private constructor(options: {
		suggester: TopicSuggester
		sendMessageHandler: SendMessageHandler
		topics: LoadedTopicDefinition[]
		lineDelay?: number
	}) {
		this.suggester = options.suggester
		this.sendMessageHandler = options.sendMessageHandler
		this.topics = options.topics
		this.lineDelay = options.lineDelay
	}

	public static async Coordinator(options: {
		topicLookupPath: string
		sendMessageHandler: SendMessageHandler
		lineDelay?: number
	}) {
		const topics = await TopicLoader.loadTopics(options.topicLookupPath)
		const suggester = await TopicSuggester.Suggester({ topics })

		return new ConversationCoordinator({
			suggester,
			sendMessageHandler: options.sendMessageHandler,
			topics,
			lineDelay: options.lineDelay,
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
			this.lastTopic = topic
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

		if (!this.player || this.lastTopic !== matchedTopic.key) {
			this.lastTopic = matchedTopic.key

			this.player = new TopicScriptPlayer({
				target,
				sendMessageHandler: this.sendMessageHandler,
				script: matchedTopic.script,
				lineDelay: this.lineDelay,
			})
		}

		const results = await this.player.handleMessage(message)

		if (results) {
			return results
		}
	}
}
