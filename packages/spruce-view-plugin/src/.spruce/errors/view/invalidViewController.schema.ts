import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const invalidViewControllerSchema: SpruceErrors.View.InvalidViewControllerSchema  = {
	id: 'invalidViewController',
	namespace: 'View',
	name: 'Invalid view controller',
	    fields: {
	            /** . */
	            'name': {
	                type: 'text',
	                options: undefined
	            },
	            /** . */
	            'id': {
	                type: 'text',
	                options: undefined
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(invalidViewControllerSchema)

export default invalidViewControllerSchema
