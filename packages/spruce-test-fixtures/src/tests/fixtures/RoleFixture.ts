import { MercuryConnectFactory } from '@sprucelabs/mercury-client'
import { SchemaError } from '@sprucelabs/schema'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import OrganizationFixture from './OrganizationFixture'

export default class RoleFixture {
	private connectToApi: MercuryConnectFactory
	private organizationFixture: OrganizationFixture

	public constructor(options: {
		connectToApi: MercuryConnectFactory
		organizationFixture: OrganizationFixture
	}) {
		this.connectToApi = options.connectToApi
		this.organizationFixture = options.organizationFixture
	}

	public async listRoles(options?: { organizationId?: string }) {
		const client = await this.connectToApi()
		let orgId = options?.organizationId

		if (!orgId) {
			const latest = await this.organizationFixture.getNewestOrganization()
			orgId = latest?.id
		}

		if (!orgId) {
			throw new SchemaError({
				code: 'MISSING_PARAMETERS',
				parameters: ['organizationId'],
				friendlyMessage:
					"You gotta @seed('organizations',1) before listing roles!",
			})
		}

		const results = await client.emit('list-roles::v2020_12_25', {
			target: {
				organizationId: orgId,
			},
			payload: {
				shouldIncludePrivateRoles: true,
			},
		})

		const { roles } = eventResponseUtil.getFirstResponseOrThrow(results)

		return roles
	}
}
