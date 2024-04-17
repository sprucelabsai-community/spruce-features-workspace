import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
    id: 'invalidFixture',
    name: 'Invalid factory',
    description: '',
    fields: {
        suppliedName: {
            type: 'text',
            isRequired: true,
        },
        validNames: {
            type: 'text',
            isRequired: true,
            isArray: true,
        },
    },
})
