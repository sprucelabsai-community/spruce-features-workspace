import { SpruceErrors } from "#spruce/errors/errors.types"
import { SpruceErrorOptions, ErrorOptions as ISpruceErrorOptions} from "@sprucelabs/error"
import { SchemaErrorOptions } from '@sprucelabs/schema'

export interface InvalidTopicErrorOptions extends SpruceErrors.SpruceConversationPlugin.InvalidTopic, ISpruceErrorOptions {
	code: 'INVALID_TOPIC'
}
export interface TopicNotFoundErrorOptions extends SpruceErrors.SpruceConversationPlugin.TopicNotFound, ISpruceErrorOptions {
	code: 'TOPIC_NOT_FOUND'
}
export interface ConversationPluginErrorErrorOptions extends SpruceErrors.SpruceConversationPlugin.ConversationPluginError, ISpruceErrorOptions {
	code: 'CONVERSATION_PLUGIN_ERROR'
}
export interface AbortErrorOptions extends SpruceErrors.SpruceConversationPlugin.Abort, ISpruceErrorOptions {
	code: 'ABORT'
}
export interface TesterNotStartedErrorOptions extends SpruceErrors.SpruceConversationPlugin.TesterNotStarted, ISpruceErrorOptions {
	code: 'TESTER_NOT_STARTED'
}
export interface MissingDependenciesErrorOptions extends SpruceErrors.SpruceConversationPlugin.MissingDependencies, ISpruceErrorOptions {
	code: 'MISSING_DEPENDENCIES'
}

type ErrorOptions = SchemaErrorOptions | SpruceErrorOptions | InvalidTopicErrorOptions  | TopicNotFoundErrorOptions  | ConversationPluginErrorErrorOptions  | AbortErrorOptions  | TesterNotStartedErrorOptions  | MissingDependenciesErrorOptions 

export default ErrorOptions
