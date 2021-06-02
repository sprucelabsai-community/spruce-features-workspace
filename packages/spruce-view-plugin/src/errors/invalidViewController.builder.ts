import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
	id: 'invalidViewController',
	name: 'Invalid view controller',
	description: '',
	fields: {
		file: {
			type: 'text',
			isRequired: true,
		},
	},
})
