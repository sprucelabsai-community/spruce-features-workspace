import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
    id: 'invalidTopic',
    name: 'Invalid topic',
    description: '',
    fields: {
        topicScript: {
            type: 'text',
            isRequired: true,
            hint: 'The script that I was attempting to load. Ends in .topic',
        },
    },
})
