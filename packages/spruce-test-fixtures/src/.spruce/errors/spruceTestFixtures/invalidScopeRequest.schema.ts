import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'

const invalidScopeRequestSchema: SpruceErrors.SpruceTestFixtures.InvalidScopeRequestSchema =
    {
        id: 'invalidScopeRequest',
        namespace: 'SpruceTestFixtures',
        name: '',
        fields: {
            /** . */
            flags: {
                type: 'text',
                isRequired: true,
                isArray: true,
                options: undefined,
            },
            /** . */
            attemptedToGet: {
                type: 'select',
                isRequired: true,
                options: {
                    choices: [
                        { value: 'location', label: 'Location' },
                        { value: 'organization', label: 'Organization' },
                    ],
                },
            },
        },
    }

SchemaRegistry.getInstance().trackSchema(invalidScopeRequestSchema)

export default invalidScopeRequestSchema
