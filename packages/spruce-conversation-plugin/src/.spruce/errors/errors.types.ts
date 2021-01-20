/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable no-redeclare */

import { default as SchemaEntity } from '@sprucelabs/schema'
import * as SpruceSchema from '@sprucelabs/schema'





export declare namespace SpruceErrors.SpruceConversation {

	
	export interface MissingDependencies {
		
			
			'dependencies': string[]
	}

	export interface MissingDependenciesSchema extends SpruceSchema.Schema {
		id: 'missingDependencies',
		namespace: 'SpruceConversation',
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

	export type MissingDependenciesEntity = SchemaEntity<SpruceErrors.SpruceConversation.MissingDependenciesSchema>

}



export declare namespace SpruceErrors.SpruceConversation {

	
	export interface ConversationPluginError {
		
	}

	export interface ConversationPluginErrorSchema extends SpruceSchema.Schema {
		id: 'conversationPluginError',
		namespace: 'SpruceConversation',
		name: 'Conversation plugin error',
		    fields: {
		    }
	}

	export type ConversationPluginErrorEntity = SchemaEntity<SpruceErrors.SpruceConversation.ConversationPluginErrorSchema>

}



export declare namespace SpruceErrors.SpruceConversation {

	
	export interface InvalidTopic {
		
			
			'topicScript': string
	}

	export interface InvalidTopicSchema extends SpruceSchema.Schema {
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

	export type InvalidTopicEntity = SchemaEntity<SpruceErrors.SpruceConversation.InvalidTopicSchema>

}




