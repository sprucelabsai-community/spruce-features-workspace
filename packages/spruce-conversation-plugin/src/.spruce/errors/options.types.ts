import { SpruceErrors } from "#spruce/errors/errors.types"
import { SpruceErrorOptions, ErrorOptions as ISpruceErrorOptions} from "@sprucelabs/error"
import { SchemaErrorOptions } from '@sprucelabs/schema'

export interface MissingDependenciesErrorOptions extends SpruceErrors.SpruceConversation.MissingDependencies, ISpruceErrorOptions {
	code: 'MISSING_DEPENDENCIES'
}
export interface ConversationPluginErrorErrorOptions extends SpruceErrors.SpruceConversation.ConversationPluginError, ISpruceErrorOptions {
	code: 'CONVERSATION_PLUGIN_ERROR'
}
export interface InvalidTopicErrorOptions extends SpruceErrors.SpruceConversation.InvalidTopic, ISpruceErrorOptions {
	code: 'INVALID_TOPIC'
}

type ErrorOptions = SchemaErrorOptions | SpruceErrorOptions | MissingDependenciesErrorOptions  | ConversationPluginErrorErrorOptions  | InvalidTopicErrorOptions 

export default ErrorOptions
