import { SpruceErrors } from "#spruce/errors/errors.types"
import { ErrorOptions as ISpruceErrorOptions} from "@sprucelabs/error"

export interface FailedToLoadStoreErrorOptions extends SpruceErrors.Store.FailedToLoadStore, ISpruceErrorOptions {
	code: 'FAILED_TO_LOAD_STORE'
}

type ErrorOptions =  | FailedToLoadStoreErrorOptions 

export default ErrorOptions
