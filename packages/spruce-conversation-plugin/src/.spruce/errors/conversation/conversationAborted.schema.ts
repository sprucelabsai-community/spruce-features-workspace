import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'

const conversationAbortedSchema: SpruceErrors.Conversation.ConversationAbortedSchema =
    {
        id: 'conversationAborted',
        namespace: 'Conversation',
        name: 'Conversation aborted',
        fields: {},
    }

SchemaRegistry.getInstance().trackSchema(conversationAbortedSchema)

export default conversationAbortedSchema
