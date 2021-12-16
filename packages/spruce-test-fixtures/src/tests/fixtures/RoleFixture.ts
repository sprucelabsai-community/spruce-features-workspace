import { SchemaError } from '@sprucelabs/schema'
import { eventResponseUtil } from '@sprucelabs/spruce-event-utils'
import { assert } from '@sprucelabs/test'
import OrganizationFixture from './OrganizationFixture'
import PersonFixture from './PersonFixture'

export default class RoleFixture {
	private organizationFixture: OrganizationFixture
	private personFixture: PersonFixture

	public constructor(options: {
		personFixture: PersonFixture
		organizationFixture: OrganizationFixture
	}) {
		this.personFixture = options.personFixture
		this.organizationFixture = options.organizationFixture
	}

	public async listRoles(options?: {
		organizationId?: string
		phone?: string
	}) {
		const { client } = await this.personFixture.loginAsDemoPerson(
			options?.phone
		)
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
