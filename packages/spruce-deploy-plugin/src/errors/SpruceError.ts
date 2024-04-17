import BaseSpruceError from '@sprucelabs/error'
import ErrorOptions from '#spruce/errors/options.types'

export default class SpruceError extends BaseSpruceError<ErrorOptions> {
    /** An easy to understand version of the errors */
    public friendlyMessage(): string {
        const { options } = this
        let message
        switch (options?.code) {
            case 'HEROKU_ERROR':
                message = 'A Heroku Error just happened!'
                break
            default:
                message = super.friendlyMessage()
        }

        const fullMessage = options.friendlyMessage
            ? options.friendlyMessage
            : message

        return fullMessage
    }
}
