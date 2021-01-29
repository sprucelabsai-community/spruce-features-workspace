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

			case 'TOPIC_NOT_FOUND':
				message = 'A Topic not found just happened!'
				break

			case 'ABORT':
				message = `Well this is embarrasing, but something went wrong and I have to abort this conversation.`
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
