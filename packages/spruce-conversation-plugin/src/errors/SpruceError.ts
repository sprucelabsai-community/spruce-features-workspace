import BaseSpruceError from '@sprucelabs/error'
import ErrorOptions from '#spruce/errors/options.types'

export default class SpruceError extends BaseSpruceError<ErrorOptions> {
	/** An easy to understand version of the errors */
	public friendlyMessage(): string {
		const { options } = this
		let message
		switch (options?.code) {
			case 'INVALID_TOPIC':
				message = `The conversation topic defined in ${options.topicScript} is not valid.`
				break
			case 'MISSING_PARAMETERS':
				message = `Looks like you're missing the following parameters: ${options.parameters.join(
					', '
				)}`
				break

			case 'CONVERSATION_PLUGIN_ERROR':
				message = 'A Conversation plugin error just happened!'
				break

			case 'MISSING_DEPENDENCIES':
				message = 'A Missing dependencies just happened!'
				break

			default:
				message = super.friendlyMessage()
		}

		// Drop on code and friendly message
		message = `${options.code}: ${message}`
		const fullMessage = `${message}${
			options.friendlyMessage && options.friendlyMessage !== message
				? `\n\n${options.friendlyMessage}`
				: ''
		}`

		// Handle repeating text from original message by remove it
		return `${fullMessage}${
			this.originalError &&
			this.originalError.message !== fullMessage &&
			this.originalError.message !== message
				? `\n\nOriginal error: ${this.originalError.message.replace(
						message,
						''
				  )}`
				: ''
		}`
	}
}
