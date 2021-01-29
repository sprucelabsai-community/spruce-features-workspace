import { CoreEventContract } from '@sprucelabs/mercury-types'
import { buildSchema, SchemaValues } from '@sprucelabs/schema'
import { SpruceSchemas } from '@sprucelabs/spruce-core-schemas'
import { EventTarget } from '@sprucelabs/spruce-event-utils'
import {
	GraphicsInterface,
	HealthCheckItem,
} from '@sprucelabs/spruce-skill-utils'

export type Message = SpruceSchemas.Spruce.v2020_07_22.Message
export type SendMessage = SpruceSchemas.Spruce.v2020_07_22.SendMessage
export type SendMessageHandler = (message: SendMessage) => Promise<void>
export type DidMessageResponsePayloadSchema = CoreEventContract['eventSignatures']['did-message::v2020_12_25']['responsePayloadSchema']
export type DidMessageResponsePayload = SchemaValues<DidMessageResponsePayloadSchema>

type ScriptLineCallbackOptions = {
	ui: GraphicsInterface
}

export type ScriptLine = string | ScriptLineCallback | string[]

export interface ScriptLineCallback {
	(
		options: ScriptLineCallbackOptions
	): Promise<void | DidMessageResponsePayload>
}
export type Script = ScriptLine[]

export interface ScriptPlayerOptions {
	script: Script
	sendMessageHandler: SendMessageHandler
	target: EventTarget
}

export type ScriptPlayerSendMessage = {
	body: string
	choices?: Message['choices']
}

export const suggestedConversationTopicSchema = buildSchema({
	id: 'conversationTopic',
	fields: {
		key: {
			type: 'text',
			isRequired: true,
		},
		confidence: {
			type: 'number',
			isRequired: true,
		},
		label: {
			type: 'text',
			isRequired: true,
		},
	},
})

export type SuggestedConversationTopicSchema = typeof suggestedConversationTopicSchema
export type SuggestedConversationTopic = SchemaValues<SuggestedConversationTopicSchema>

export interface Topic {
	key: string
	label: string
	utterances: string[]
}

export interface TopicDefinition extends Omit<Topic, 'key'> {
	script: Script
}

export interface ConversationHealthCheckItem extends HealthCheckItem {
	topics: string[]
}

export type LoadedTopicDefinition = TopicDefinition & {
	key: string
}

declare module '@sprucelabs/spruce-skill-utils/build/skill.types' {
	export interface HealthCheckResults {
		conversation?: ConversationHealthCheckItem
	}
}

export type ScriptPlayerSendMessageHandler = (
	message: ScriptPlayerSendMessage
) => Promise<void>
