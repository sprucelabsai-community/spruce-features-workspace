import { SpruceErrors } from "#spruce/errors/errors.types"
import { SpruceErrorOptions, ErrorOptions as ISpruceErrorOptions} from "@sprucelabs/error"
import { SchemaErrorOptions } from '@sprucelabs/schema'

export interface HerokuErrorErrorOptions extends SpruceErrors.SpruceDeployPlugin.HerokuError, ISpruceErrorOptions {
	code: 'HEROKU_ERROR'
}

type ErrorOptions = SchemaErrorOptions | SpruceErrorOptions | HerokuErrorErrorOptions 

export default ErrorOptions
