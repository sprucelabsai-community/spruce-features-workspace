import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const invalidFixtureSchema: SpruceErrors.SpruceTestFixtures.InvalidFixtureSchema  = {
	id: 'invalidFixture',
	namespace: 'SpruceTestFixtures',
	name: 'Invalid factory',
	    fields: {
	            /** . */
	            'suppliedName': {
	                type: 'text',
	                isRequired: true,
	                options: undefined
	            },
	            /** . */
	            'validNames': {
	                type: 'text',
	                isRequired: true,
	                isArray: true,
	                options: undefined
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(invalidFixtureSchema)

export default invalidFixtureSchema
