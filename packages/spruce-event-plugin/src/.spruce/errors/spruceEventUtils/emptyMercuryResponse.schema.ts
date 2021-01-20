import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const emptyMercuryResponseSchema: SpruceErrors.SpruceEventUtils.EmptyMercuryResponseSchema  = {
	id: 'emptyMercuryResponse',
	namespace: 'SpruceEventUtils',
	name: 'empty mercury response',
	    fields: {
	    }
}

SchemaRegistry.getInstance().trackSchema(emptyMercuryResponseSchema)

export default emptyMercuryResponseSchema
