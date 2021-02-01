import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const missingDependenciesSchema: SpruceErrors.SpruceConversationPlugin.MissingDependenciesSchema  = {
	id: 'missingDependencies',
	namespace: 'SpruceConversationPlugin',
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
