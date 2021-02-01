import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const testerNotStartedSchema: SpruceErrors.SpruceConversationPlugin.TesterNotStartedSchema  = {
	id: 'testerNotStarted',
	namespace: 'SpruceConversationPlugin',
	name: 'Tester not started',
	    fields: {
	    }
}

SchemaRegistry.getInstance().trackSchema(testerNotStartedSchema)

export default testerNotStartedSchema
