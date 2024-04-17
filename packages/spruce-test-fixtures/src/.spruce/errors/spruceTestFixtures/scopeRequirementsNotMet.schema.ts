import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'

const scopeRequirementsNotMetSchema: SpruceErrors.SpruceTestFixtures.ScopeRequirementsNotMetSchema =
    {
        id: 'scopeRequirementsNotMet',
        namespace: 'SpruceTestFixtures',
        name: 'scope requirements not met',
        fields: {},
    }

SchemaRegistry.getInstance().trackSchema(scopeRequirementsNotMetSchema)

export default scopeRequirementsNotMetSchema
