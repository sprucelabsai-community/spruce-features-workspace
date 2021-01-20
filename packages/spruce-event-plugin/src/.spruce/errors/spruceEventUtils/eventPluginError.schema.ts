import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const eventPluginErrorSchema: SpruceErrors.SpruceEventUtils.EventPluginErrorSchema  = {
	id: 'eventPluginError',
	namespace: 'SpruceEventUtils',
	name: 'event plugin error',
	    fields: {
	    }
}

SchemaRegistry.getInstance().trackSchema(eventPluginErrorSchema)

export default eventPluginErrorSchema
