import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'

const failedToLoadStoreSchema: SpruceErrors.Store.FailedToLoadStoreSchema = {
    id: 'failedToLoadStore',
    namespace: 'Store',
    name: 'Failed to load store',
    fields: {
        /** . */
        name: {
            type: 'text',
            isRequired: true,
            options: undefined,
        },
    },
}

SchemaRegistry.getInstance().trackSchema(failedToLoadStoreSchema)

export default failedToLoadStoreSchema
