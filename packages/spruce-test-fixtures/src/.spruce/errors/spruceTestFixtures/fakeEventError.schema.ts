import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const fakeEventErrorSchema: SpruceErrors.SpruceTestFixtures.FakeEventErrorSchema  = {
	id: 'fakeEventError',
	namespace: 'SpruceTestFixtures',
	name: 'Fake event error',
	    fields: {
	            /** . */
	            'fqen': {
	                type: 'text',
	                isRequired: true,
	                options: undefined
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(fakeEventErrorSchema)

export default fakeEventErrorSchema
