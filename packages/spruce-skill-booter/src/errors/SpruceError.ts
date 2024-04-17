import AbstractSpruceError, {
    ErrorOptions as IErrorOptions,
} from '@sprucelabs/error'

interface FailedToLoadPluginErrorOptions extends IErrorOptions {
    code: 'FAILED_TO_LOAD_PLUGIN'
    file: string
}

interface InvalidFeatureCodeErrorOptions extends IErrorOptions {
    code: 'INVALID_FEATURE_CODE'
    suppliedCode: string
    validCodes: string[]
}

export type ErrorOptions =
    | FailedToLoadPluginErrorOptions
    | InvalidFeatureCodeErrorOptions

export default class SpruceError extends AbstractSpruceError<ErrorOptions> {
    public friendlyMessage() {
        let message = super.friendlyMessage()

        switch (this.options.code) {
            case 'FAILED_TO_LOAD_PLUGIN':
                message = `Failed to load the plugin at ${this.options.file}.\n\n`
                message += this.options.friendlyMessage
                break
            case 'INVALID_FEATURE_CODE':
                message = `"${
                    this.options.suppliedCode
                }" is not a valid feature code. Valid codes are: ${this.options.validCodes.join(
                    ', '
                )}`
                break
        }

        return message
    }
}
