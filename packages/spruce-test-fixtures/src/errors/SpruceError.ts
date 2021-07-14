import BaseSpruceError from '@sprucelabs/error'
import ErrorOptions from '#spruce/errors/options.types'

export default class SpruceError extends BaseSpruceError<ErrorOptions> {
	public friendlyMessage(): string {
		const { options } = this
		let message
		switch (options?.code) {
			case 'MISSING_PARAMETERS':
				message = `Looks like you're missing the following parameters: ${options.parameters.join(
					', '
				)}`
				break

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
