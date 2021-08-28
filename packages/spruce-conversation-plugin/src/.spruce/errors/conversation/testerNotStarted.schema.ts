import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const testerNotStartedSchema: SpruceErrors.Conversation.TesterNotStartedSchema  = {
	id: 'testerNotStarted',
	namespace: 'Conversation',
	name: 'Tester not started',
	    fields: {
	    }
}

SchemaRegistry.getInstance().trackSchema(testerNotStartedSchema)

export default testerNotStartedSchema
