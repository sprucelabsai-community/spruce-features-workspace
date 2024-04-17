import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
    id: 'fakeEventError',
    name: 'Fake event error',
    fields: {
        fqen: {
            type: 'text',
            isRequired: true,
        },
    },
})
