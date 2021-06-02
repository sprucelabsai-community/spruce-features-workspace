import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const unknownViewControllerErrorSchema: SpruceErrors.View.UnknownViewControllerErrorSchema  = {
	id: 'unknownViewControllerError',
	namespace: 'View',
	name: 'Unkown view controller error',
	    fields: {
	            /** . */
	            'file': {
	                type: 'text',
	                isRequired: true,
	                options: undefined
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(unknownViewControllerErrorSchema)

export default unknownViewControllerErrorSchema
