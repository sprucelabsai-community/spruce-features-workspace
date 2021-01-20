import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const missingDependenciesSchema: SpruceErrors.SpruceConversation.MissingDependenciesSchema  = {
	id: 'missingDependencies',
	namespace: 'SpruceConversation',
	name: 'Missing dependencies',
	    fields: {
	            /** . */
	            'dependencies': {
	                type: 'text',
	                isRequired: true,
	                isArray: true,
	                options: undefined
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(missingDependenciesSchema)

export default missingDependenciesSchema
