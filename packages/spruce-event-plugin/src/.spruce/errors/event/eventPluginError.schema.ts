import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'

const eventPluginErrorSchema: SpruceErrors.Event.EventPluginErrorSchema = {
    id: 'eventPluginError',
    namespace: 'Event',
    name: 'event plugin error',
    fields: {},
}

SchemaRegistry.getInstance().trackSchema(eventPluginErrorSchema)

export default eventPluginErrorSchema
