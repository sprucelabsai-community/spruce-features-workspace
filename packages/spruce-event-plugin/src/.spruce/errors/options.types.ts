import { SpruceErrors } from "#spruce/errors/errors.types"
import { SpruceErrorOptions, ErrorOptions as ISpruceErrorOptions} from "@sprucelabs/error"
import { SchemaErrorOptions } from '@sprucelabs/schema'

export interface DuplicateEventErrorOptions extends SpruceErrors.SpruceEventUtils.DuplicateEvent, ISpruceErrorOptions {
	code: 'DUPLICATE_EVENT'
}
export interface MercuryResponseErrorErrorOptions extends SpruceErrors.SpruceEventUtils.MercuryResponseError, ISpruceErrorOptions {
	code: 'MERCURY_RESPONSE_ERROR'
}
export interface EventPluginErrorErrorOptions extends SpruceErrors.SpruceEventUtils.EventPluginError, ISpruceErrorOptions {
	code: 'EVENT_PLUGIN_ERROR'
}
export interface InvalidEventNameErrorOptions extends SpruceErrors.SpruceEventUtils.InvalidEventName, ISpruceErrorOptions {
	code: 'INVALID_EVENT_NAME'
}
export interface EmptyMercuryResponseErrorOptions extends SpruceErrors.SpruceEventUtils.EmptyMercuryResponse, ISpruceErrorOptions {
	code: 'EMPTY_MERCURY_RESPONSE'
}

type ErrorOptions = SchemaErrorOptions | SpruceErrorOptions | DuplicateEventErrorOptions  | MercuryResponseErrorErrorOptions  | EventPluginErrorErrorOptions  | InvalidEventNameErrorOptions  | EmptyMercuryResponseErrorOptions 

export default ErrorOptions
