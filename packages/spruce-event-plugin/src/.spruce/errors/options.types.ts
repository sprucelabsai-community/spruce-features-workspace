import { ErrorOptions as ISpruceErrorOptions } from '@sprucelabs/error'
import { SpruceErrors } from '#spruce/errors/errors.types'

export interface EventPluginErrorErrorOptions
    extends SpruceErrors.Event.EventPluginError,
        ISpruceErrorOptions {
    code: 'EVENT_PLUGIN_ERROR'
}

type ErrorOptions = EventPluginErrorErrorOptions

export default ErrorOptions
