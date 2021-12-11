import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
	id: 'mockEventError',
	name: 'Mock event error',
	fields: {
		fqen: {
			type: 'text',
			isRequired: true,
		},
	},
})
