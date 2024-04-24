import { default as SchemaEntity } from '@sprucelabs/schema'
import * as SpruceSchema from '@sprucelabs/schema'











export declare namespace SpruceErrors.Conversation {

	
	export interface TopicNotFound {
		
			
			'suppliedTopic': string
			
			'validTopics': string[]
	}

	export interface TopicNotFoundSchema extends SpruceSchema.Schema {
		id: 'topicNotFound',
		namespace: 'Conversation',
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

	export type TopicNotFoundEntity = SchemaEntity<SpruceErrors.Conversation.TopicNotFoundSchema>

}


export declare namespace SpruceErrors.Conversation {

	
	export interface TesterNotStarted {
		
	}

	export interface TesterNotStartedSchema extends SpruceSchema.Schema {
		id: 'testerNotStarted',
		namespace: 'Conversation',
		name: 'Tester not started',
		    fields: {
		    }
	}

	export type TesterNotStartedEntity = SchemaEntity<SpruceErrors.Conversation.TesterNotStartedSchema>

}


export declare namespace SpruceErrors.Conversation {

	
	export interface MissingDependencies {
		
			
			'dependencies': string[]
	}

	export interface MissingDependenciesSchema extends SpruceSchema.Schema {
		id: 'missingDependencies',
		namespace: 'Conversation',
		name: 'Missing dependencies',
		    fields: {
		            /** . */
		            'dependencies': {
		                type: 'text',
		                isRequired: true,
		                isArray: true,
		                options: undefined
		            },
		    }
	}

	export type MissingDependenciesEntity = SchemaEntity<SpruceErrors.Conversation.MissingDependenciesSchema>

}


export declare namespace SpruceErrors.Conversation {

	
	export interface InvalidTopic {
		
			/** . The script that I was attempting to load. Ends in .topic */
			'topicScript': string
	}

	export interface InvalidTopicSchema extends SpruceSchema.Schema {
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

	export type InvalidTopicEntity = SchemaEntity<SpruceErrors.Conversation.InvalidTopicSchema>

}


export declare namespace SpruceErrors.Conversation {

	
	export interface ConversationPluginError {
		
	}

	export interface ConversationPluginErrorSchema extends SpruceSchema.Schema {
		id: 'conversationPluginError',
		namespace: 'Conversation',
		name: 'Conversation plugin error',
		    fields: {
		    }
	}

	export type ConversationPluginErrorEntity = SchemaEntity<SpruceErrors.Conversation.ConversationPluginErrorSchema>

}


export declare namespace SpruceErrors.Conversation {

	
	export interface ConversationAborted {
		
	}

	export interface ConversationAbortedSchema extends SpruceSchema.Schema {
		id: 'conversationAborted',
		namespace: 'Conversation',
		name: 'Conversation aborted',
		    fields: {
		    }
	}

	export type ConversationAbortedEntity = SchemaEntity<SpruceErrors.Conversation.ConversationAbortedSchema>

}


export declare namespace SpruceErrors.Conversation {

	
	export interface Abort {
		
	}

	export interface AbortSchema extends SpruceSchema.Schema {
		id: 'abort',
		namespace: 'Conversation',
		name: 'Abort',
		    fields: {
		    }
	}

	export type AbortEntity = SchemaEntity<SpruceErrors.Conversation.AbortSchema>

}




