import { SpruceErrors } from "#spruce/errors/errors.types"
import { ErrorOptions as ISpruceErrorOptions} from "@sprucelabs/error"

export interface HerokuErrorErrorOptions extends SpruceErrors.Deploy.HerokuError, ISpruceErrorOptions {
	code: 'HEROKU_ERROR'
}

type ErrorOptions =  | HerokuErrorErrorOptions 

export default ErrorOptions
