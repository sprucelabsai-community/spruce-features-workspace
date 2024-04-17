import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
    id: 'unknownViewControllerError',
    name: 'Unkown view controller error',
    description: '',
    fields: {
        id: {
            type: 'text',
        },
        name: {
            type: 'text',
        },
    },
})
