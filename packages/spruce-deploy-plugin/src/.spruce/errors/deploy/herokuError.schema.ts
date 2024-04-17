import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'

const herokuErrorSchema: SpruceErrors.Deploy.HerokuErrorSchema = {
    id: 'herokuError',
    namespace: 'Deploy',
    name: 'Heroku Error',
    fields: {},
}

SchemaRegistry.getInstance().trackSchema(herokuErrorSchema)

export default herokuErrorSchema
