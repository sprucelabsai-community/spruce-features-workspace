import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const unknownViewControllerErrorSchema: SpruceErrors.SpruceTestFixtures.UnknownViewControllerErrorSchema  = {
	id: 'unknownViewControllerError',
	namespace: 'SpruceTestFixtures',
	name: 'Unkown view controller error',
	    fields: {
	            /** . */
	            'id': {
	                type: 'text',
	                options: undefined
	            },
	            /** . */
	            'name': {
	                type: 'text',
	                options: undefined
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(unknownViewControllerErrorSchema)

export default unknownViewControllerErrorSchema
