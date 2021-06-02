/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable no-redeclare */

import { default as SchemaEntity } from '@sprucelabs/schema'
import * as SpruceSchema from '@sprucelabs/schema'





export declare namespace SpruceErrors.View {

	
	export interface UnknownViewControllerError {
		
			
			'file': string
	}

	export interface UnknownViewControllerErrorSchema extends SpruceSchema.Schema {
		id: 'unknownViewControllerError',
		namespace: 'View',
		name: 'Unkown view controller error',
		    fields: {
		            /** . */
		            'file': {
		                type: 'text',
		                isRequired: true,
		                options: undefined
		            },
		    }
	}

	export type UnknownViewControllerErrorEntity = SchemaEntity<SpruceErrors.View.UnknownViewControllerErrorSchema>

}



export declare namespace SpruceErrors.View {

	
	export interface InvalidViewController {
		
			
			'file': string
	}

	export interface InvalidViewControllerSchema extends SpruceSchema.Schema {
		id: 'invalidViewController',
		namespace: 'View',
		name: 'Invalid view controller',
		    fields: {
		            /** . */
		            'file': {
		                type: 'text',
		                isRequired: true,
		                options: undefined
		            },
		    }
	}

	export type InvalidViewControllerEntity = SchemaEntity<SpruceErrors.View.InvalidViewControllerSchema>

}




