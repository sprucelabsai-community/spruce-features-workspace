import { default as SchemaEntity } from '@sprucelabs/schema'
import * as SpruceSchema from '@sprucelabs/schema'

export declare namespace SpruceErrors.Event {
    export interface EventPluginError {}

    export interface EventPluginErrorSchema extends SpruceSchema.Schema {
        id: 'eventPluginError'
        namespace: 'Event'
        name: 'event plugin error'
        fields: {}
    }

    export type EventPluginErrorEntity =
        SchemaEntity<SpruceErrors.Event.EventPluginErrorSchema>
}
