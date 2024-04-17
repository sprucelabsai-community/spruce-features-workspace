import BaseSpruceError from '@sprucelabs/error'
import ErrorOptions from '#spruce/errors/options.types'

export default class SpruceError extends BaseSpruceError<ErrorOptions> {
    public friendlyMessage(): string {
        const { options } = this
        let message
        switch (options?.code) {
            case 'FAILED_TO_LOAD_STORE':
                message = `Dang it, I couldn't load your ${options.name} store!`
                if (options.originalError) {
                    message +=
                        '\n\nOriginal error:\n\n' +
                        options.originalError.message
                }
                break

            case 'FAILED_TO_LOAD_DB_ADAPTER':
                message = `I could not load your database adapter '${options.name}'. Check env.DB_ADAPTER is set to something you have included in your package.json.`
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
