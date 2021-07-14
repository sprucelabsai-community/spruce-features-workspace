import { SpruceErrors } from "#spruce/errors/errors.types"
import { SpruceErrorOptions, ErrorOptions as ISpruceErrorOptions} from "@sprucelabs/error"
import { SchemaErrorOptions } from '@sprucelabs/schema'

export interface UnknownViewControllerErrorErrorOptions extends SpruceErrors.SpruceTestFixtures.UnknownViewControllerError, ISpruceErrorOptions {
	code: 'UNKNOWN_VIEW_CONTROLLER_ERROR'
}
export interface SkillNotFoundErrorOptions extends SpruceErrors.SpruceTestFixtures.SkillNotFound, ISpruceErrorOptions {
	code: 'SKILL_NOT_FOUND'
}
export interface InvalidViewControllerErrorOptions extends SpruceErrors.SpruceTestFixtures.InvalidViewController, ISpruceErrorOptions {
	code: 'INVALID_VIEW_CONTROLLER'
}
export interface InvalidFixtureErrorOptions extends SpruceErrors.SpruceTestFixtures.InvalidFixture, ISpruceErrorOptions {
	code: 'INVALID_FIXTURE'
}

type ErrorOptions = SchemaErrorOptions | SpruceErrorOptions | UnknownViewControllerErrorErrorOptions  | SkillNotFoundErrorOptions  | InvalidViewControllerErrorOptions  | InvalidFixtureErrorOptions 

export default ErrorOptions
