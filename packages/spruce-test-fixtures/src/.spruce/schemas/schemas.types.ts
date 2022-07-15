/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable no-redeclare */

export { SpruceSchemas } from '@sprucelabs/spruce-core-schemas/build/.spruce/schemas/core.schemas.types'

import { default as SchemaEntity } from '@sprucelabs/schema'



import * as SpruceSchema from '@sprucelabs/schema'

import * as HeartwoodViewController from "@sprucelabs/heartwood-view-controllers"

declare module '@sprucelabs/spruce-core-schemas/build/.spruce/schemas/core.schemas.types' {


	namespace SpruceSchemas.SpruceTestFixtures.v2021_07_19 {

		
		interface TestRouterEmitPayload {
			
				
				'id': string
				
				'vc': (HeartwoodViewController.SkillViewController)
				
				'args'?: (Record<string, any>)| undefined | null
		}

		interface TestRouterEmitPayloadSchema extends SpruceSchema.Schema {
			id: 'testRouterEmitPayload',
			version: 'v2021_07_19',
			namespace: 'SpruceTestFixtures',
			name: 'Test Router Emit payload',
			    fields: {
			            /** . */
			            'id': {
			                type: 'text',
			                isRequired: true,
			                options: undefined
			            },
			            /** . */
			            'vc': {
			                type: 'raw',
			                isRequired: true,
			                options: {valueType: `HeartwoodViewController.SkillViewController`,}
			            },
			            /** . */
			            'args': {
			                type: 'raw',
			                options: {valueType: `Record<string, any>`,}
			            },
			    }
		}

		interface TestRouterEmitPayloadEntity extends SchemaEntity<SpruceSchemas.SpruceTestFixtures.v2021_07_19.TestRouterEmitPayloadSchema> {}

	}

}
