import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
    id: 'failedToLoadDbAdapter',
    name: 'Failed to load db adapter',
    fields: {
        name: {
            type: 'text',
            isRequired: true,
        },
    },
})
