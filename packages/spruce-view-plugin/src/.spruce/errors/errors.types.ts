/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable no-redeclare */

import { default as SchemaEntity } from '@sprucelabs/schema'
import * as SpruceSchema from '@sprucelabs/schema'





export declare namespace SpruceErrors.View {

	
	export interface UnknownViewControllerError {
		
			
			'id'?: string| undefined | null
			
			'name'?: string| undefined | null
	}

	export interface UnknownViewControllerErrorSchema extends SpruceSchema.Schema {
		id: 'unknownViewControllerError',
		namespace: 'View',
		name: 'Unkown view controller error',
		    fields: {
		            /** . */
		            'id': {
		                type: 'text',
		                options: undefined
		            },
		            /** . */
		            'name': {
		                type: 'text',
		                options: undefined
		            },
		    }
	}

	export type UnknownViewControllerErrorEntity = SchemaEntity<SpruceErrors.View.UnknownViewControllerErrorSchema>

}



export declare namespace SpruceErrors.View {

	
	export interface InvalidViewController {
		
			
			'name'?: string| undefined | null
			
			'id'?: string| undefined | null
	}

	export interface InvalidViewControllerSchema extends SpruceSchema.Schema {
		id: 'invalidViewController',
		namespace: 'View',
		name: 'Invalid view controller',
		    fields: {
		            /** . */
		            'name': {
		                type: 'text',
		                options: undefined
		            },
		            /** . */
		            'id': {
		                type: 'text',
		                options: undefined
		            },
		    }
	}

	export type InvalidViewControllerEntity = SchemaEntity<SpruceErrors.View.InvalidViewControllerSchema>

}




