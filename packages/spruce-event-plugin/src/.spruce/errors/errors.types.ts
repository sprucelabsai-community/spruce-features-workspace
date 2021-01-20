/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable no-redeclare */

import { default as SchemaEntity } from '@sprucelabs/schema'
import * as SpruceSchema from '@sprucelabs/schema'





export declare namespace SpruceErrors.SpruceEventUtils {

	
	export interface DuplicateEvent {
		
			
			'fullyQualifiedEventName'?: string| undefined | null
	}

	export interface DuplicateEventSchema extends SpruceSchema.Schema {
		id: 'duplicateEvent',
		namespace: 'SpruceEventUtils',
		name: 'Duplicate event',
		    fields: {
		            /** . */
		            'fullyQualifiedEventName': {
		                type: 'text',
		                options: undefined
		            },
		    }
	}

	export type DuplicateEventEntity = SchemaEntity<SpruceErrors.SpruceEventUtils.DuplicateEventSchema>

}


import AbstractSpruceError from '@sprucelabs/error'

export declare namespace SpruceErrors.SpruceEventUtils {

	
	export interface MercuryResponseError {
		
			
			'responseErrors': (AbstractSpruceError<any>)[]
	}

	export interface MercuryResponseErrorSchema extends SpruceSchema.Schema {
		id: 'mercuryResponseError',
		namespace: 'SpruceEventUtils',
		name: 'Mercury response error',
		    fields: {
		            /** . */
		            'responseErrors': {
		                type: 'raw',
		                isRequired: true,
		                isArray: true,
		                options: {valueType: `AbstractSpruceError<any>`,}
		            },
		    }
	}

	export type MercuryResponseErrorEntity = SchemaEntity<SpruceErrors.SpruceEventUtils.MercuryResponseErrorSchema>

}



export declare namespace SpruceErrors.SpruceEventUtils {

	
	export interface EventPluginError {
		
	}

	export interface EventPluginErrorSchema extends SpruceSchema.Schema {
		id: 'eventPluginError',
		namespace: 'SpruceEventUtils',
		name: 'event plugin error',
		    fields: {
		    }
	}

	export type EventPluginErrorEntity = SchemaEntity<SpruceErrors.SpruceEventUtils.EventPluginErrorSchema>

}



export declare namespace SpruceErrors.SpruceEventUtils {

	
	export interface InvalidEventName {
		
			
			'fullyQualifiedEventName': string
			
			'validNames': string[]
	}

	export interface InvalidEventNameSchema extends SpruceSchema.Schema {
		id: 'invalidEventName',
		namespace: 'SpruceEventUtils',
		name: 'Invalid event name',
		    fields: {
		            /** . */
		            'fullyQualifiedEventName': {
		                type: 'text',
		                isRequired: true,
		                options: undefined
		            },
		            /** . */
		            'validNames': {
		                type: 'text',
		                isRequired: true,
		                isArray: true,
		                options: undefined
		            },
		    }
	}

	export type InvalidEventNameEntity = SchemaEntity<SpruceErrors.SpruceEventUtils.InvalidEventNameSchema>

}



export declare namespace SpruceErrors.SpruceEventUtils {

	
	export interface EmptyMercuryResponse {
		
	}

	export interface EmptyMercuryResponseSchema extends SpruceSchema.Schema {
		id: 'emptyMercuryResponse',
		namespace: 'SpruceEventUtils',
		name: 'empty mercury response',
		    fields: {
		    }
	}

	export type EmptyMercuryResponseEntity = SchemaEntity<SpruceErrors.SpruceEventUtils.EmptyMercuryResponseSchema>

}




