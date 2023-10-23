import { SpruceErrors } from "#spruce/errors/errors.types"
import { ErrorOptions as ISpruceErrorOptions} from "@sprucelabs/error"

export interface FailedToLoadStoreErrorOptions extends SpruceErrors.Store.FailedToLoadStore, ISpruceErrorOptions {
	code: 'FAILED_TO_LOAD_STORE'
}
export interface FailedToLoadDbAdapterErrorOptions extends SpruceErrors.Store.FailedToLoadDbAdapter, ISpruceErrorOptions {
	code: 'FAILED_TO_LOAD_DB_ADAPTER'
}

type ErrorOptions =  | FailedToLoadStoreErrorOptions  | FailedToLoadDbAdapterErrorOptions 

export default ErrorOptions
