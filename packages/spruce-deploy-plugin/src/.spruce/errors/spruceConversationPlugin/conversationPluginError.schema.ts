import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const conversationPluginErrorSchema: SpruceErrors.SpruceConversationPlugin.ConversationPluginErrorSchema  = {
	id: 'conversationPluginError',
	namespace: 'SpruceConversationPlugin',
	name: 'Conversation plugin error',
	    fields: {
	    }
}

SchemaRegistry.getInstance().trackSchema(conversationPluginErrorSchema)

export default conversationPluginErrorSchema
