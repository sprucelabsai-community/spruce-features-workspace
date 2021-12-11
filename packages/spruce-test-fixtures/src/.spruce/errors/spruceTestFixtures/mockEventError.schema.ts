import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const mockEventErrorSchema: SpruceErrors.SpruceTestFixtures.MockEventErrorSchema  = {
	id: 'mockEventError',
	namespace: 'SpruceTestFixtures',
	name: 'Mock event error',
	    fields: {
	            /** . */
	            'fqen': {
	                type: 'text',
	                isRequired: true,
	                options: undefined
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(mockEventErrorSchema)

export default mockEventErrorSchema
