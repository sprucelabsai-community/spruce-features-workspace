/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable no-redeclare */

import { default as SchemaEntity } from '@sprucelabs/schema'
import * as SpruceSchema from '@sprucelabs/schema'





export declare namespace SpruceErrors.SpruceDeployPlugin {

	
	export interface HerokuError {
		
	}

	export interface HerokuErrorSchema extends SpruceSchema.Schema {
		id: 'herokuError',
		namespace: 'SpruceDeployPlugin',
		name: 'Heroku Error',
		    fields: {
		    }
	}

	export type HerokuErrorEntity = SchemaEntity<SpruceErrors.SpruceDeployPlugin.HerokuErrorSchema>

}




