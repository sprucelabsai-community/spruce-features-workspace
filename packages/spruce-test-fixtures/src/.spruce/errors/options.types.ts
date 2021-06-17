import { SpruceErrors } from "#spruce/errors/errors.types"
import { SpruceErrorOptions, ErrorOptions as ISpruceErrorOptions} from "@sprucelabs/error"
import { SchemaErrorOptions } from '@sprucelabs/schema'

export interface SkillNotFoundErrorOptions extends SpruceErrors.SpruceTestFixtures.SkillNotFound, ISpruceErrorOptions {
	code: 'SKILL_NOT_FOUND'
}
export interface InvalidFixtureErrorOptions extends SpruceErrors.SpruceTestFixtures.InvalidFixture, ISpruceErrorOptions {
	code: 'INVALID_FIXTURE'
}

type ErrorOptions = SchemaErrorOptions | SpruceErrorOptions | SkillNotFoundErrorOptions  | InvalidFixtureErrorOptions 

export default ErrorOptions
