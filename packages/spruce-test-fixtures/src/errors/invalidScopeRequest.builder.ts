import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
	id: 'invalidScopeRequest',
	fields: {
		flags: {
			type: 'text',
			isRequired: true,
			isArray: true,
		},
		attemptedToGet: {
			type: 'select',
			isRequired: true,
			options: {
				choices: [
					{
						value: 'location',
						label: 'Location',
					},
					{
						value: 'organization',
						label: 'Organization',
					},
				],
			},
		},
	},
})
