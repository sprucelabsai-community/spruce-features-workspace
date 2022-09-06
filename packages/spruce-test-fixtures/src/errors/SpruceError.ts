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
				message = `A faked response to '${options.fqen}' threw an error! If this failed a test it's time to try/catch and possibly render an alert()! If this was expected (the tests pass), then ignore it.`
				break

			case 'INVALID_TARGET':
				message = `I could not find anything at that target.`
				break

			case 'NOT_FOUND':
				message = `I could not find what you are looking for!`
				break

			case 'SCOPE_REQUIREMENTS_NOT_MET':
				message = `Scope requirements not met! Make sure you are seeding what you expect (location or org)!`
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
