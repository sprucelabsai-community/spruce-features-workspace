import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const invalidTopicSchema: SpruceErrors.SpruceConversation.InvalidTopicSchema  = {
	id: 'invalidTopic',
	namespace: 'SpruceConversation',
	name: 'Invalid topic',
	    fields: {
	            /** . */
	            'topicScript': {
	                type: 'text',
	                isRequired: true,
	                options: undefined
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(invalidTopicSchema)

export default invalidTopicSchema
