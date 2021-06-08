import BaseSpruceError from '@sprucelabs/error'
import ErrorOptions from '#spruce/errors/options.types'

export default class SpruceError extends BaseSpruceError<ErrorOptions> {
	/** An easy to understand version of the errors */
	public friendlyMessage(): string {
		const { options } = this
		let message
		switch (options?.code) {
			case 'INVALID_VIEW_CONTROLLER':
				message = `Dang! The view controller named ${
					options.name ?? options.id
				} is not valid..`
				break

			case 'UNKNOWN_VIEW_CONTROLLER_ERROR':
				message = `No idea what happened when trying to load the view controller ${
					options.name ?? options.id
				}! The original error is:\n\n${options.originalError?.stack}`
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
