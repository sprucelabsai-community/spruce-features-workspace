import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const conversationPluginErrorSchema: SpruceErrors.SpruceConversation.ConversationPluginErrorSchema  = {
	id: 'conversationPluginError',
	namespace: 'SpruceConversation',
	name: 'Conversation plugin error',
	    fields: {
	    }
}

SchemaRegistry.getInstance().trackSchema(conversationPluginErrorSchema)

export default conversationPluginErrorSchema
