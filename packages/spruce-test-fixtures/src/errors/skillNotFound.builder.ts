import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
    id: 'skillNotFound',
    name: 'Skill not found',
    description: '',
    fields: {
        slug: {
            type: 'text',
            isRequired: true,
        },
    },
})
