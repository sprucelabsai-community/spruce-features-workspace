import { default as SchemaEntity } from '@sprucelabs/schema'
import * as SpruceSchema from '@sprucelabs/schema'

export declare namespace SpruceErrors.Deploy {
    export interface HerokuError {}

    export interface HerokuErrorSchema extends SpruceSchema.Schema {
        id: 'herokuError'
        namespace: 'Deploy'
        name: 'Heroku Error'
        fields: {}
    }

    export type HerokuErrorEntity =
        SchemaEntity<SpruceErrors.Deploy.HerokuErrorSchema>
}
