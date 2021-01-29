/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable no-redeclare */

import { default as SchemaEntity } from '@sprucelabs/schema'
import * as SpruceSchema from '@sprucelabs/schema'





export declare namespace SpruceErrors.SpruceConversationPlugin {

	
	export interface TopicNotFound {
		
			
			'suppliedTopic': string
			
			'validTopics': string[]
	}

	export interface TopicNotFoundSchema extends SpruceSchema.Schema {
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

	export type TopicNotFoundEntity = SchemaEntity<SpruceErrors.SpruceConversationPlugin.TopicNotFoundSchema>

}



export declare namespace SpruceErrors.SpruceConversationPlugin {

	
	export interface InvalidTopic {
		
			/** . The script that I was attempting to load. Ends in .topic */
			'topicScript': string
	}

	export interface InvalidTopicSchema extends SpruceSchema.Schema {
		id: 'invalidTopic',
		namespace: 'SpruceConversationPlugin',
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

	export type InvalidTopicEntity = SchemaEntity<SpruceErrors.SpruceConversationPlugin.InvalidTopicSchema>

}



export declare namespace SpruceErrors.SpruceConversationPlugin {

	
	export interface MissingDependencies {
		
			
			'dependencies': string[]
	}

	export interface MissingDependenciesSchema extends SpruceSchema.Schema {
		id: 'missingDependencies',
		namespace: 'SpruceConversationPlugin',
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

	export type MissingDependenciesEntity = SchemaEntity<SpruceErrors.SpruceConversationPlugin.MissingDependenciesSchema>

}



export declare namespace SpruceErrors.SpruceConversationPlugin {

	
	export interface Abort {
		
	}

	export interface AbortSchema extends SpruceSchema.Schema {
		id: 'abort',
		namespace: 'SpruceConversationPlugin',
		name: 'Abort',
		    fields: {
		    }
	}

	export type AbortEntity = SchemaEntity<SpruceErrors.SpruceConversationPlugin.AbortSchema>

}



export declare namespace SpruceErrors.SpruceConversationPlugin {

	
	export interface ConversationPluginError {
		
	}

	export interface ConversationPluginErrorSchema extends SpruceSchema.Schema {
		id: 'conversationPluginError',
		namespace: 'SpruceConversationPlugin',
		name: 'Conversation plugin error',
		    fields: {
		    }
	}

	export type ConversationPluginErrorEntity = SchemaEntity<SpruceErrors.SpruceConversationPlugin.ConversationPluginErrorSchema>

}




