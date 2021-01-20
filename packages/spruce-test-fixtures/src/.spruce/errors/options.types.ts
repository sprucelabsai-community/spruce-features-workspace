import { SpruceErrors } from "#spruce/errors/errors.types"
import { SpruceErrorOptions, ErrorOptions as ISpruceErrorOptions} from "@sprucelabs/error"
import { SchemaErrorOptions } from '@sprucelabs/schema'

export interface InvalidFixtureErrorOptions extends SpruceErrors.SpruceTestFixtures.InvalidFixture, ISpruceErrorOptions {
	code: 'INVALID_FIXTURE'
}

type ErrorOptions = SchemaErrorOptions | SpruceErrorOptions | InvalidFixtureErrorOptions 

export default ErrorOptions
