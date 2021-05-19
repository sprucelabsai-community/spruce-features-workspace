import { SpruceErrors } from "#spruce/errors/errors.types"
import { SpruceErrorOptions, ErrorOptions as ISpruceErrorOptions} from "@sprucelabs/error"
import { SchemaErrorOptions } from '@sprucelabs/schema'

export interface EventPluginErrorErrorOptions extends SpruceErrors.Event.EventPluginError, ISpruceErrorOptions {
	code: 'EVENT_PLUGIN_ERROR'
}

type ErrorOptions = SchemaErrorOptions | SpruceErrorOptions | EventPluginErrorErrorOptions 

export default ErrorOptions
