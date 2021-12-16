import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { SchemaError } from '@sprucelabs/schema'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { assert } from '@sprucelabs/test'
import PersonFixture from './PersonFixture'

type GetNewestOrgHandler =
	() => Promise<SpruceSchemas.Spruce.v2020_07_22.Organization | null>

export default class RoleFixture {
	private personFixture: PersonFixture
	private getNewestOrgHandler: GetNewestOrgHandler

	public constructor(options: {
		personFixture: PersonFixture
		getNewestOrg: GetNewestOrgHandler
	}) {
		this.personFixture = options.personFixture
		this.getNewestOrgHandler = options.getNewestOrg
	}

	public async listRoles(options?: {
		organizationId?: string
		locationId?: string
		personId?: string
		phone?: string
	}) {
		let { organizationId, locationId, personId, phone } = options ?? {}

		const { client } = await this.personFixture.loginAsDemoPerson(phone)

		if (!organizationId && !locationId) {
			const latest = await this.getNewestOrgHandler()
			organizationId = latest?.id
		}

		if (!organizationId && !locationId) {
			throw new SchemaError({
				code: 'MISSING_PARAMETERS',
				parameters: ['organizationId'],
				friendlyMessage:
					"You gotta @seed('organizations',1) before listing roles!",
			})
		}

		const results = await client.emit('list-roles::v2020_12_25', {
			target: {
				organizationId,
				personId,
				locationId,
			},
			payload: {
				shouldIncludePrivateRoles: true,
			},
		})

		const { roles } = eventResponseUtil.getFirstResponseOrThrow(results)

		return roles
	}

	public async fetchFirstRoleWithBase(options: {
		organizationId: string
		base: string
		phone?: string
	}) {
		const roles = await this.listRoles(options)
		const role = roles.find((role) => role.base === options.base)

		assert.isTruthy(role)

		return role
	}
}
