import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
	id: 'missingDependencies',
	name: 'Missing dependencies',
	description: '',
	fields: {
		dependencies: {
			type: 'text',
			isRequired: true,
			isArray: true,
		},
	},
})
