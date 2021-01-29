import { SpruceErrors } from "#spruce/errors/errors.types"
import { SpruceErrorOptions, ErrorOptions as ISpruceErrorOptions} from "@sprucelabs/error"
import { SchemaErrorOptions } from '@sprucelabs/schema'

export interface TopicNotFoundErrorOptions extends SpruceErrors.SpruceConversationPlugin.TopicNotFound, ISpruceErrorOptions {
	code: 'TOPIC_NOT_FOUND'
}
export interface InvalidTopicErrorOptions extends SpruceErrors.SpruceConversationPlugin.InvalidTopic, ISpruceErrorOptions {
	code: 'INVALID_TOPIC'
}
export interface MissingDependenciesErrorOptions extends SpruceErrors.SpruceConversationPlugin.MissingDependencies, ISpruceErrorOptions {
	code: 'MISSING_DEPENDENCIES'
}
export interface AbortErrorOptions extends SpruceErrors.SpruceConversationPlugin.Abort, ISpruceErrorOptions {
	code: 'ABORT'
}
export interface ConversationPluginErrorErrorOptions extends SpruceErrors.SpruceConversationPlugin.ConversationPluginError, ISpruceErrorOptions {
	code: 'CONVERSATION_PLUGIN_ERROR'
}

type ErrorOptions = SchemaErrorOptions | SpruceErrorOptions | TopicNotFoundErrorOptions  | InvalidTopicErrorOptions  | MissingDependenciesErrorOptions  | AbortErrorOptions  | ConversationPluginErrorErrorOptions 

export default ErrorOptions
