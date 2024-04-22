import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'

const missingDependenciesSchema: SpruceErrors.Conversation.MissingDependenciesSchema =
    {
        id: 'missingDependencies',
        namespace: 'Conversation',
        name: 'Missing dependencies',
        fields: {
            /** . */
            dependencies: {
                type: 'text',
                isRequired: true,
                isArray: true,
                options: undefined,
            },
        },
    }

SchemaRegistry.getInstance().trackSchema(missingDependenciesSchema)

export default missingDependenciesSchema
