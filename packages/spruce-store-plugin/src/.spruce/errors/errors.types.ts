/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable no-redeclare */

import { default as SchemaEntity } from '@sprucelabs/schema'
import * as SpruceSchema from '@sprucelabs/schema'





export declare namespace SpruceErrors.Store {

	
	export interface FailedToLoadStore {
		
			
			'name': string
	}

	export interface FailedToLoadStoreSchema extends SpruceSchema.Schema {
		id: 'failedToLoadStore',
		namespace: 'Store',
		name: 'Failed to load store',
		    fields: {
		            /** . */
		            'name': {
		                type: 'text',
		                isRequired: true,
		                options: undefined
		            },
		    }
	}

	export type FailedToLoadStoreEntity = SchemaEntity<SpruceErrors.Store.FailedToLoadStoreSchema>

}



export declare namespace SpruceErrors.Store {

	
	export interface FailedToLoadDbAdapter {
		
			
			'name': string
	}

	export interface FailedToLoadDbAdapterSchema extends SpruceSchema.Schema {
		id: 'failedToLoadDbAdapter',
		namespace: 'Store',
		name: 'Failed to load db adapter',
		    fields: {
		            /** . */
		            'name': {
		                type: 'text',
		                isRequired: true,
		                options: undefined
		            },
		    }
	}

	export type FailedToLoadDbAdapterEntity = SchemaEntity<SpruceErrors.Store.FailedToLoadDbAdapterSchema>

}




