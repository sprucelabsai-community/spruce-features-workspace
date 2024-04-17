import { ErrorOptions as ISpruceErrorOptions } from '@sprucelabs/error'
import { SpruceErrors } from '#spruce/errors/errors.types'

export interface HerokuErrorErrorOptions
    extends SpruceErrors.Deploy.HerokuError,
        ISpruceErrorOptions {
    code: 'HEROKU_ERROR'
}

type ErrorOptions = HerokuErrorErrorOptions

export default ErrorOptions
