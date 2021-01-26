import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const topicNotFoundSchema: SpruceErrors.SpruceConversationPlugin.TopicNotFoundSchema  = {
	id: 'topicNotFound',
	namespace: 'SpruceConversationPlugin',
	name: 'Topic not found',
	    fields: {
	            /** . */
	            'suppliedTopic': {
	                type: 'text',
	                isRequired: true,
	                options: undefined
	            },
	            /** . */
	            'validTopics': {
	                type: 'text',
	                isRequired: true,
	                isArray: true,
	                options: undefined
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(topicNotFoundSchema)

export default topicNotFoundSchema
