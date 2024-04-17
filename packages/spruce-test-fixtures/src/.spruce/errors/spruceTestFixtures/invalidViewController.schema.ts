import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'

const invalidViewControllerSchema: SpruceErrors.SpruceTestFixtures.InvalidViewControllerSchema =
    {
        id: 'invalidViewController',
        namespace: 'SpruceTestFixtures',
        name: 'Invalid view controller',
        fields: {
            /** . */
            name: {
                type: 'text',
                options: undefined,
            },
            /** . */
            id: {
                type: 'text',
                options: undefined,
            },
        },
    }

SchemaRegistry.getInstance().trackSchema(invalidViewControllerSchema)

export default invalidViewControllerSchema
