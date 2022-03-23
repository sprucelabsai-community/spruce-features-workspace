import BaseSpruceError from '@sprucelabs/error'
import ErrorOptions from '#spruce/errors/options.types'

export default class SpruceError extends BaseSpruceError<ErrorOptions> {
	public friendlyMessage(): string {
		const { options } = this
		let message
		switch (options?.code) {
			case 'INVALID_FIXTURE':
				message = `"${
					options.suppliedName
				}" is not a valid fixture name. Try: \n\n${options.validNames.join(
					'\n'
				)}`
				break

			case 'SKILL_NOT_FOUND':
				message = `Couldn't find skill with slug ${options.slug}!`
				break

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

			case 'FAKE_EVENT_ERROR':
				message = `A Faked response threw an error! Probably time to try/catch and render an alert()!`
				break

			case 'INVALID_TARGET':
				message = 'A invalid target just happened!'
				break

			default:
				message = super.friendlyMessage()
		}

		const fullMessage = `${message}${
			options.friendlyMessage && options.friendlyMessage !== message
				? `\n\n${options.friendlyMessage}`
				: ''
		}`

		return fullMessage
	}
}
