import { generateId } from '@sprucelabs/data-stores'
import {
	Authorizer,
	SpruceSchemas,
} from '@sprucelabs/heartwood-view-controllers'

export default class SpyAuthorizer implements Authorizer {
	public async getPermissions(options: {
		contractId: string
		permissionsIds: string[]
	}): Promise<SpruceSchemas.Mercury.v2020_12_25.ResolvedContract> {
		return {
			contractId: generateId(),
			permissions: [],
		}
	}
}
