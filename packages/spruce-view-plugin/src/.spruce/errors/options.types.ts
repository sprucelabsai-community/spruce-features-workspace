import { SpruceErrors } from "#spruce/errors/errors.types"
import { SpruceErrorOptions, ErrorOptions as ISpruceErrorOptions} from "@sprucelabs/error"
import { SchemaErrorOptions } from '@sprucelabs/schema'

export interface UnknownViewControllerErrorErrorOptions extends SpruceErrors.View.UnknownViewControllerError, ISpruceErrorOptions {
	code: 'UNKNOWN_VIEW_CONTROLLER_ERROR'
}
export interface InvalidViewControllerErrorOptions extends SpruceErrors.View.InvalidViewController, ISpruceErrorOptions {
	code: 'INVALID_VIEW_CONTROLLER'
}

type ErrorOptions = SchemaErrorOptions | SpruceErrorOptions | UnknownViewControllerErrorErrorOptions  | InvalidViewControllerErrorOptions 

export default ErrorOptions
