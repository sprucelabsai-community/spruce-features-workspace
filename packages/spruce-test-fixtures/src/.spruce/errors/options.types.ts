import { SpruceErrors } from "#spruce/errors/errors.types"
import { ErrorOptions as ISpruceErrorOptions} from "@sprucelabs/error"

export interface UnknownViewControllerErrorErrorOptions extends SpruceErrors.SpruceTestFixtures.UnknownViewControllerError, ISpruceErrorOptions {
	code: 'UNKNOWN_VIEW_CONTROLLER_ERROR'
}
export interface SkillNotFoundErrorOptions extends SpruceErrors.SpruceTestFixtures.SkillNotFound, ISpruceErrorOptions {
	code: 'SKILL_NOT_FOUND'
}
export interface MockEventErrorErrorOptions extends SpruceErrors.SpruceTestFixtures.MockEventError, ISpruceErrorOptions {
	code: 'MOCK_EVENT_ERROR'
}
export interface InvalidViewControllerErrorOptions extends SpruceErrors.SpruceTestFixtures.InvalidViewController, ISpruceErrorOptions {
	code: 'INVALID_VIEW_CONTROLLER'
}
export interface InvalidFixtureErrorOptions extends SpruceErrors.SpruceTestFixtures.InvalidFixture, ISpruceErrorOptions {
	code: 'INVALID_FIXTURE'
}

type ErrorOptions =  | UnknownViewControllerErrorErrorOptions  | SkillNotFoundErrorOptions  | MockEventErrorErrorOptions  | InvalidViewControllerErrorOptions  | InvalidFixtureErrorOptions 

export default ErrorOptions
