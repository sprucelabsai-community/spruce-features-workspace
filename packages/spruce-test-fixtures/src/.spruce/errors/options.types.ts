import { SpruceErrors } from "#spruce/errors/errors.types"
import { ErrorOptions as ISpruceErrorOptions} from "@sprucelabs/error"

export interface UnknownViewControllerErrorErrorOptions extends SpruceErrors.SpruceTestFixtures.UnknownViewControllerError, ISpruceErrorOptions {
	code: 'UNKNOWN_VIEW_CONTROLLER_ERROR'
}
export interface SkillNotFoundErrorOptions extends SpruceErrors.SpruceTestFixtures.SkillNotFound, ISpruceErrorOptions {
	code: 'SKILL_NOT_FOUND'
}
export interface NotFoundErrorOptions extends SpruceErrors.SpruceTestFixtures.NotFound, ISpruceErrorOptions {
	code: 'NOT_FOUND'
}
export interface InvalidViewControllerErrorOptions extends SpruceErrors.SpruceTestFixtures.InvalidViewController, ISpruceErrorOptions {
	code: 'INVALID_VIEW_CONTROLLER'
}
export interface InvalidTargetErrorOptions extends SpruceErrors.SpruceTestFixtures.InvalidTarget, ISpruceErrorOptions {
	code: 'INVALID_TARGET'
}
export interface InvalidFixtureErrorOptions extends SpruceErrors.SpruceTestFixtures.InvalidFixture, ISpruceErrorOptions {
	code: 'INVALID_FIXTURE'
}
export interface FakeEventErrorErrorOptions extends SpruceErrors.SpruceTestFixtures.FakeEventError, ISpruceErrorOptions {
	code: 'FAKE_EVENT_ERROR'
}

type ErrorOptions =  | UnknownViewControllerErrorErrorOptions  | SkillNotFoundErrorOptions  | NotFoundErrorOptions  | InvalidViewControllerErrorOptions  | InvalidTargetErrorOptions  | InvalidFixtureErrorOptions  | FakeEventErrorErrorOptions 

export default ErrorOptions
