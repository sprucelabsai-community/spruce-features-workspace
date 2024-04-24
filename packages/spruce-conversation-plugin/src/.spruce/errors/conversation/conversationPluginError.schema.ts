import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const conversationPluginErrorSchema: SpruceErrors.Conversation.ConversationPluginErrorSchema  = {
	id: 'conversationPluginError',
	namespace: 'Conversation',
	name: 'Conversation plugin error',
	    fields: {
	    }
}

SchemaRegistry.getInstance().trackSchema(conversationPluginErrorSchema)

export default conversationPluginErrorSchema
