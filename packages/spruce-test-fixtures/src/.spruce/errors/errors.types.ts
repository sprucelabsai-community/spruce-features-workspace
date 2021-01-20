/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable no-redeclare */

import { default as SchemaEntity } from '@sprucelabs/schema'
import * as SpruceSchema from '@sprucelabs/schema'





export declare namespace SpruceErrors.SpruceTestFixtures {

	
	export interface InvalidFixture {
		
			
			'suppliedName': string
			
			'validNames': string[]
	}

	export interface InvalidFixtureSchema extends SpruceSchema.Schema {
		id: 'invalidFixture',
		namespace: 'SpruceTestFixtures',
		name: 'Invalid factory',
		    fields: {
		            /** . */
		            'suppliedName': {
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

	export type InvalidFixtureEntity = SchemaEntity<SpruceErrors.SpruceTestFixtures.InvalidFixtureSchema>

}




