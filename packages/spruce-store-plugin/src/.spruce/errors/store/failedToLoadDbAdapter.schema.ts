import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'

const failedToLoadDbAdapterSchema: SpruceErrors.Store.FailedToLoadDbAdapterSchema =
    {
        id: 'failedToLoadDbAdapter',
        namespace: 'Store',
        name: 'Failed to load db adapter',
        fields: {
            /** . */
            name: {
                type: 'text',
                isRequired: true,
                options: undefined,
            },
        },
    }

SchemaRegistry.getInstance().trackSchema(failedToLoadDbAdapterSchema)

export default failedToLoadDbAdapterSchema
