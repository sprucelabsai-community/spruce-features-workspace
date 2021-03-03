/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable no-redeclare */

import { default as SchemaEntity } from '@sprucelabs/schema'
import * as SpruceSchema from '@sprucelabs/schema'





export declare namespace SpruceErrors.SpruceStorePlugin {

	
	export interface FailedToLoadStore {
		
			
			'name': string
	}

	export interface FailedToLoadStoreSchema extends SpruceSchema.Schema {
		id: 'failedToLoadStore',
		namespace: 'SpruceStorePlugin',
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

	export type FailedToLoadStoreEntity = SchemaEntity<SpruceErrors.SpruceStorePlugin.FailedToLoadStoreSchema>

}




