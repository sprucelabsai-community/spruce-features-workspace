import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
    id: 'notFound',
    name: 'not found',
    fields: {},
})
