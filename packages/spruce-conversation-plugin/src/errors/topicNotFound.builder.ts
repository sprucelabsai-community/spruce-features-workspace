import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
    id: 'topicNotFound',
    name: 'Topic not found',
    description: '',
    fields: {
        suppliedTopic: {
            type: 'text',
            isRequired: true,
        },
        validTopics: {
            type: 'text',
            isRequired: true,
            isArray: true,
        },
    },
})
