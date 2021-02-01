import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const abortSchema: SpruceErrors.SpruceConversationPlugin.AbortSchema  = {
	id: 'abort',
	namespace: 'SpruceConversationPlugin',
	name: 'Abort',
	    fields: {
	    }
}

SchemaRegistry.getInstance().trackSchema(abortSchema)

export default abortSchema
