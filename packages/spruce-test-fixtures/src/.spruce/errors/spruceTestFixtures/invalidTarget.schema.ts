import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const invalidTargetSchema: SpruceErrors.SpruceTestFixtures.InvalidTargetSchema  = {
	id: 'invalidTarget',
	namespace: 'SpruceTestFixtures',
	name: 'invalid target',
	    fields: {
	    }
}

SchemaRegistry.getInstance().trackSchema(invalidTargetSchema)

export default invalidTargetSchema
