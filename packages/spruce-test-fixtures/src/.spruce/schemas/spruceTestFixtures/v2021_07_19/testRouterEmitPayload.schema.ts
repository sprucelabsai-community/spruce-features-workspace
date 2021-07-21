import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceSchemas } from '../../schemas.types'



const testRouterEmitPayloadSchema: SpruceSchemas.SpruceTestFixtures.v2021_07_19.TestRouterEmitPayloadSchema  = {
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

SchemaRegistry.getInstance().trackSchema(testRouterEmitPayloadSchema)

export default testRouterEmitPayloadSchema
