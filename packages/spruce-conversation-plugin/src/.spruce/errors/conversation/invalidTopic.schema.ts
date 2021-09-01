import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const invalidTopicSchema: SpruceErrors.Conversation.InvalidTopicSchema  = {
	id: 'invalidTopic',
	namespace: 'Conversation',
	name: 'Invalid topic',
	    fields: {
	            /** . The script that I was attempting to load. Ends in .topic */
	            'topicScript': {
	                type: 'text',
	                isRequired: true,
	                hint: 'The script that I was attempting to load. Ends in .topic',
	                options: undefined
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(invalidTopicSchema)

export default invalidTopicSchema
