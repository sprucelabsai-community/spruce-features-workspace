import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const conversationAbortedSchema: SpruceErrors.SpruceConversationPlugin.ConversationAbortedSchema  = {
	id: 'conversationAborted',
	namespace: 'SpruceConversationPlugin',
	name: 'Conversation aborted',
	    fields: {
	    }
}

SchemaRegistry.getInstance().trackSchema(conversationAbortedSchema)

export default conversationAbortedSchema
