import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const herokuErrorSchema: SpruceErrors.SpruceDeployPlugin.HerokuErrorSchema  = {
	id: 'herokuError',
	namespace: 'SpruceDeployPlugin',
	name: 'Heroku Error',
	    fields: {
	    }
}

SchemaRegistry.getInstance().trackSchema(herokuErrorSchema)

export default herokuErrorSchema
