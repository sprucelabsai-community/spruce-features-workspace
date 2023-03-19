import { SkillEventContract } from '@sprucelabs/mercury-core-events'
import { SchemaError, SchemaValues } from '@sprucelabs/schema'
import { SkillContext } from '@sprucelabs/spruce-skill-utils'
import SpruceError from '../errors/SpruceError'
import TopicLoader from '../topics/TopicLoader'
import { TopicScriptPlayer } from '../topics/TopicScriptPlayer'
import { TopicSuggester } from '../topics/TopicSuggester'
import {
	LoadedTopicDefinition,
	Message,
	SendMessageHandler,
} from '../types/conversation.types'

type MessageResponsePayloadSchema =
	SkillEventContract['eventSignatures']['did-message::v2020_12_25']['responsePayloadSchema']
type MessageResponsePayload = SchemaValues<MessageResponsePayloadSchema>

type GetContext = () => SkillContext

export class ConversationCoordinator {
	private suggester: TopicSuggester
	private sendMessageHandler: SendMessageHandler
	private topics: LoadedTopicDefinition[]
	protected player?: TopicScriptPlayer
	private lastTopic?: string
	private lineDelay?: number
	private getContext: GetContext

	protected constructor(options: {
		suggester: TopicSuggester
		sendMessageHandler: SendMessageHandler
		topics: LoadedTopicDefinition[]
		lineDelay?: number
		getContext: GetContext
	}) {
		this.suggester = options.suggester
		this.sendMessageHandler = options.sendMessageHandler
		this.topics = options.topics
		this.lineDelay = options.lineDelay
		this.getContext = options.getContext
	}

	public static async Coordinator(options: {
		topicLookupPath: string
		sendMessageHandler: SendMessageHandler
		lineDelay?: number
		getContext: GetContext
		Class?: new (...args: any[]) => ConversationCoordinator
	}) {
		const {
			Class,
			topicLookupPath,
			sendMessageHandler,
			lineDelay,
			getContext,
		} = options

		const topics = await TopicLoader.loadTopics(topicLookupPath)
		const suggester = await TopicSuggester.Suggester({ topics })

		return new (Class ?? ConversationCoordinator)({
			suggester,
			sendMessageHandler,
			topics,
			lineDelay,
			getContext,
		})
	}

	public async handleMessage(
		message: Message,
		topic?: string
	): Promise<MessageResponsePayload | void> {
		if (!message.source.personId) {
			throw new SchemaError({
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
				getContext: this.getContext,
			})
		}

		const results = await this.player.handleMessage(message)

		if (results) {
			return results
		}
	}
}
