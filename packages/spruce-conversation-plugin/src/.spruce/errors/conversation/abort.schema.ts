import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const abortSchema: SpruceErrors.Conversation.AbortSchema  = {
	id: 'abort',
	namespace: 'Conversation',
	name: 'Abort',
	    fields: {
	    }
}

SchemaRegistry.getInstance().trackSchema(abortSchema)

export default abortSchema
