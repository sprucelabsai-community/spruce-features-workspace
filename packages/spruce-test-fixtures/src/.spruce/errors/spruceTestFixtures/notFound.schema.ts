import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'

const notFoundSchema: SpruceErrors.SpruceTestFixtures.NotFoundSchema = {
    id: 'notFound',
    namespace: 'SpruceTestFixtures',
    name: 'not found',
    fields: {},
}

SchemaRegistry.getInstance().trackSchema(notFoundSchema)

export default notFoundSchema
