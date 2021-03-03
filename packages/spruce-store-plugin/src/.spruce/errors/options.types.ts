import { SpruceErrors } from "#spruce/errors/errors.types"
import { SpruceErrorOptions, ErrorOptions as ISpruceErrorOptions} from "@sprucelabs/error"
import { SchemaErrorOptions } from '@sprucelabs/schema'

export interface FailedToLoadStoreErrorOptions extends SpruceErrors.SpruceStorePlugin.FailedToLoadStore, ISpruceErrorOptions {
	code: 'FAILED_TO_LOAD_STORE'
}

type ErrorOptions = SchemaErrorOptions | SpruceErrorOptions | FailedToLoadStoreErrorOptions 

export default ErrorOptions
