import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const invalidViewControllerSchema: SpruceErrors.View.InvalidViewControllerSchema  = {
	id: 'invalidViewController',
	namespace: 'View',
	name: 'Invalid view controller',
	    fields: {
	            /** . */
	            'file': {
	                type: 'text',
	                isRequired: true,
	                options: undefined
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(invalidViewControllerSchema)

export default invalidViewControllerSchema
