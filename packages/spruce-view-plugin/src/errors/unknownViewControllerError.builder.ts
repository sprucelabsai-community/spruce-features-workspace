import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
	id: 'unknownViewControllerError',
	name: 'Unkown view controller error',
	description: '',
	fields: {
		file: {
			type: 'text',
			isRequired: true,
		},
	},
})
