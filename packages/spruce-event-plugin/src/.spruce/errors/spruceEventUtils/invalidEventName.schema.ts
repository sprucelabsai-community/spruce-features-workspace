import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const invalidEventNameSchema: SpruceErrors.SpruceEventUtils.InvalidEventNameSchema  = {
	id: 'invalidEventName',
	namespace: 'SpruceEventUtils',
	name: 'Invalid event name',
	    fields: {
	            /** . */
	            'fullyQualifiedEventName': {
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

SchemaRegistry.getInstance().trackSchema(invalidEventNameSchema)

export default invalidEventNameSchema
