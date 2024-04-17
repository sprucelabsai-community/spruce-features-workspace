import { ErrorOptions as ISpruceErrorOptions } from '@sprucelabs/error'
import { SpruceErrors } from '#spruce/errors/errors.types'

export interface TopicNotFoundErrorOptions
    extends SpruceErrors.Conversation.TopicNotFound,
        ISpruceErrorOptions {
    code: 'TOPIC_NOT_FOUND'
}
export interface TesterNotStartedErrorOptions
    extends SpruceErrors.Conversation.TesterNotStarted,
        ISpruceErrorOptions {
    code: 'TESTER_NOT_STARTED'
}
export interface MissingDependenciesErrorOptions
    extends SpruceErrors.Conversation.MissingDependencies,
        ISpruceErrorOptions {
    code: 'MISSING_DEPENDENCIES'
}
export interface InvalidTopicErrorOptions
    extends SpruceErrors.Conversation.InvalidTopic,
        ISpruceErrorOptions {
    code: 'INVALID_TOPIC'
}
export interface ConversationPluginErrorErrorOptions
    extends SpruceErrors.Conversation.ConversationPluginError,
        ISpruceErrorOptions {
    code: 'CONVERSATION_PLUGIN_ERROR'
}
export interface ConversationAbortedErrorOptions
    extends SpruceErrors.Conversation.ConversationAborted,
        ISpruceErrorOptions {
    code: 'CONVERSATION_ABORTED'
}
export interface AbortErrorOptions
    extends SpruceErrors.Conversation.Abort,
        ISpruceErrorOptions {
    code: 'ABORT'
}

type ErrorOptions =
    | TopicNotFoundErrorOptions
    | TesterNotStartedErrorOptions
    | MissingDependenciesErrorOptions
    | InvalidTopicErrorOptions
    | ConversationPluginErrorErrorOptions
    | ConversationAbortedErrorOptions
    | AbortErrorOptions

export default ErrorOptions
